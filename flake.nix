{
  inputs = {
    # use hugo 0.145.0 to avoid breaking changes
    nixpkgs.url = "github:NixOS/nixpkgs/f9642bd8de37073a1d6c096b7d9fbed15d337576";
    flake-parts.url = "github:hercules-ci/flake-parts";
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } {
      systems = [
        "x86_64-linux"
        "aarch64-linux"
        "x86_64-darwin"
        "aarch64-darwin"
      ];

      perSystem =
        { pkgs, ... }:
        {
          devShells.default = pkgs.mkShell {
            name = "woxQAQ's blog flake";

            buildInputs = with pkgs; [
              pnpm
            ];
          };
        };
    };
}
