---
title: Agent系列(1) —— 什么是 agent loop
published: 2026-09-09
description: ''
image: ''
tags: ["ai"]
category: 'tech'
draft: false
lang: 'zh-CN'
---
# 什么是 agent loop?

我们用一个函数来定义一个最简单的 agent loop

```ts
declare async function agentLoop(input_prompt)
```

Agent loop 的工作原理是发一个消息数组给大模型，然后我们接受大模型的响应，把他拼成一条消息，把这个消息塞进原来的数组再发给大模型。
这样一个循环逻辑就是agent loop了。等等，这样不会死循环吗？当然会！所以我们需要退出条件。聪明的研究员们早就帮我们想好了，
一般来说，如果大模型的响应没有包含工具调用的内容，就可以认为这次 loop 应该退出了。

```ts
async function agentLoop(input_prompt)  {
    const messages = [input_prompt];
    while (true) {
        const response = await chatAndSplice(messages)
        messages.push(response.messages)
        if (!response.contains_tool()) {
            break;
        }
        for (message in response.messages) {
            switch (message.type) {
                case "tool_call":
                    const tool = message.tool_call_id;
                    const tool_result = await callTool(tool);
                    messages.push(tool_result)
                // ...
            }
        }
    }
}

await agentLoop({ role: "user", content: "帮我看看当前目录有哪些文件" });
```

ok, 这样一个带有工具调用执行的 minimal agent loop 就做好了。先不管这里出现的一些未定义黑盒函数的实现，
这样一个简易的loop在逻辑上还存在一些的问题

- messages 是一次性的，本次loop所产生的信息完全被丢弃，无法实现多轮对话
- 大模型的输出是流式的，事件的,而一次agentloop的完整运行时间短暂几分钟，长则以小时计。
  这意味着几乎所有的agent产品都需要以流式的方式输出大模型吐出的token。当前的做法并没有 bypass 一个通道给调用者去消费 token

先解决第一个问题，我们引入一个 context 用来“持久化” agent loop 的消息。

```ts
async function agentLoop(input_prompt, context) {
    const messages = context.messages;
    messages.push(input_prompt);

    while (true) {
        const response = await chatAndSplice(messages);
        messages.push(...response.messages);

        if (!response.contains_tool()) {
            break;
        }

        for (const message of response.messages) {
            switch (message.type) {
                case "tool_call": {
                    const tool = message.tool_call_id;
                    const tool_result = await callTool(tool);
                    messages.push(tool_result);
                    break;
                }
                // ...
            }
        }
    }
}

// 同一段对话的多次调用共用一个 context。
const context = { messages: [] };
await agentLoop({ role: "user", content: "帮我看看当前目录有哪些文件" }, context);
await agentLoop({ role: "user", content: "读一下其中的 README.md" }, context);
```

为了解决第二个问题，我们需要让这个 loop 同步并立即返回一个 EventStream

EventStream 就是事件流。调用者拿到它后，可以用 `for await...of` 逐个消费事件，而 loop 在执行过程中不断往里面放入新事件。
这样就不用等整轮对话结束，才能显示模型已经生成的内容。

先把 EventStream 当作一个黑盒，它需要支持三个操作：

- `push(event)`：放入一个事件；尚未被消费的事件保存在队列中。
- `end()`：标记事件流结束；调用者消费完队列里的事件后，退出迭代。
- `for await...of`：按顺序取出事件；队列为空且尚未结束时，等待下一个事件。

同时给 `chatAndSplice` 增加一个回调参数：它每收到一段模型输出，就立即调用这个回调，
例如传入 `{ type: "text_delta", text: "你好" }`。`text_delta` 表示本次新增的文本片段，不一定刚好是一个 token。
它仍然负责拼接完整响应，并在本次模型输出结束后返回。这里保留前面的黑盒约定，暂时不展开这两个函数的底层实现。

```ts
function agentLoop(input_prompt, context) {
    const eventStream = new EventStream();

    async function run() {
        try {
            const messages = context.messages;
            messages.push(input_prompt);

            while (true) {
                const response = await chatAndSplice(messages, (event) => {
                    eventStream.push(event);
                });
                messages.push(...response.messages);

                if (!response.contains_tool()) {
                    eventStream.push({ type: "agent_end" });
                    break;
                }

                for (const message of response.messages) {
                    switch (message.type) {
                        case "tool_call": {
                            const tool = message.tool_call_id;
                            eventStream.push({ type: "tool_start", tool });
                            const tool_result = await callTool(tool);
                            messages.push(tool_result);
                            eventStream.push({ type: "tool_end", tool, result: tool_result });
                            break;
                        }
                        // ...
                    }
                }
            }
        } catch (error) {
            eventStream.push({ type: "error", error });
        } finally {
            eventStream.end();
        }
    }

    // 启动执行，不等待整轮对话完成就返回事件流。
    void run();
    return eventStream;
}

const context = { messages: [] };
const eventStream = agentLoop({ role: "user", content: "读一下 README.md" }, context);

for await (const event of eventStream) {
    switch (event.type) {
        case "text_delta":
            process.stdout.write(event.text);
            break;
        case "tool_start":
            console.log("开始执行工具：", event.tool);
            break;
        case "tool_end":
            console.log("工具执行完成：", event.tool);
            break;
        case "agent_end":
            console.log("本轮对话结束");
            break;
        case "error":
            console.error("本轮对话失败：", event.error);
            break;
    }
}
```

注意外层的 `agentLoop` 已经不再是 `async` 函数，因此返回的是 EventStream 本身。
内部的 `run` 仍然是异步函数，遇到 `await` 时会让出执行，让调用者有机会消费事件，这不需要额外启动一个线程。

现在有了两份用途不同的数据：context 中保存完整消息，供下一次模型请求使用；eventStream 中传递增量文本、
工具执行状态和结束通知，供调用者即时展示。工具调用仍然要等参数拼接完整后再执行。
无论正常结束还是执行失败，都要关闭事件流，否则调用者可能一直等不到下一个事件。

同一个 context 的下一轮调用，需要等当前事件流消费结束后再开始，避免两轮执行交错修改消息。

# 总结

以上看到的就是 pi 的核心原理了。pi 就是基于这小小的核心往外延展的
- 在 @pi-coding-agent package 中，通过消费 eventStream 的事件来创建对应的 tui 组件，通过message_update 事件来实现流式输出
- 通过完善 `chatAndSplice` 黑盒的实现，最后得到了他们处理不同 ai provider 的 @pi-ai package 和完整的session协议;
- 通过对 agent loop 本身进行事件化建模，他们实现了 agent hooks, 并成为 pi extension 的基础。
- ...

本系列的核心观点：复杂的系统总是从简单的概念长起来的，只要抓住本质就能掌握全局

# 接下来?

只讲一个agent loop当然不是本系列的目的，接下来的文章我们会引入更多的概念，上下文管理，session tree，工具，记忆等等
