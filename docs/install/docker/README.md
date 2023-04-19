
Installing using Docker
=======================

1.  Recommended OS is Ubuntu focal.
    Any later Ubuntu LTS should work as well.
1.  Install:
    * git
    * Docker CE (Community Edition) &rarr; [Docker Ubuntu Install Guide](
      https://docs.docker.com/engine/install/ubuntu/)
    * an apache webserver with `mod_proxy` and Shibboleth.
      * [How to configure your Apache](../../cfg/reverse_proxy/apache/)
1.  Create an OS user `annosrv` as member of a group with the same name.
    We'll assume the home directory is `/srv/annosrv`.
1.  `chown annosrv:annosrv -- /srv/annosrv`
1.  Start a shell as user `annosrv` in its home directory.
1.  Usually, you'd now `git clone https://github.com/mk-pmb/anno-server-22`
    * … but this config example uses the staging branch,
      so to the `clone` command, add: `--single-branch --branch staging`
    * The "staging" is almost as unstable as "experimental".
      Expect frequent history rewrites.
1.  `cd -- anno-server-22`
1.  `./util/install_dockerized.sh`
    (For what and why, see `util/install_dockerized.md` next to it.)
1.  Install your instance config as a subdirectory named `cfg.@` + the
    instance's hostname. You can choose any; in this example, we will assume
    that hostname to be `dkas22`.
    * An example config directory can be found in
      [../../cfg/ubhd-ex01/](../../cfg/ubhd-ex01/).
      To use it: `cp -rnT -- docs/cfg/ubhd-ex01/ cfg.@dkas22`
    * See the example config's `README.md` for how to adjust it.
1.  Set up a DevDock project.
    A good place to put it is inside your instance config directory.
    * An example config directory can be found in
      [../../cfg/as22.devdock/](../../cfg/as22.devdock/).
      To use it: `cp -rnt cfg.@dkas22/ -- docs/cfg/as22.devdock`
    * See the example project's `README.md` for how to adjust it.
    * The part in front of `.devdock` is the DevDock project name,
      which will be used as a prefix for your docker container names.









