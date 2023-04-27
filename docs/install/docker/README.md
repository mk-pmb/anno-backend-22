
Installing using Docker
=======================

1.  Recommended OS is Ubuntu focal.
    Any later Ubuntu LTS should work as well.
1.  Install:
    * git
    * Docker CE (Community Edition) &rarr; [Docker Ubuntu Install Guide](
      https://docs.docker.com/engine/install/ubuntu/)
    * an apache webserver with `mod_proxy`
      * optionally, some sort of user login mechanism for Apache.
      * [How to configure your Apache](../../cfg/reverse_proxy/apache/)
1.  Create an OS user `annosrv` as member of a group with the same name.
    We'll assume the home directory is `/srv/annosrv`.
1.  `chown annosrv:annosrv -- /srv/annosrv`
1.  Start a shell as user `annosrv` in its home directory.
1.  Ensure that user `annosrv` has no control over the docker daemon.
    (Earlier versions of this guide advised the opposite.)
    1.  Test access to the docker daemon: Run `docker version`
    1.  The expected good response should include the message
        "ERROR: Got permission denied while trying to connect to the
        Docker daemon socket".
    1.  If that error message is missing, remove user `annosrv` from all
        docker-related OS user groups and reboot.
1.  Usually, you'd now `git clone https://github.com/mk-pmb/anno-server-22`
    * … but this config example uses the staging branch,
      so to the `clone` command, add: `--single-branch --branch staging`
    * The "staging" is almost as unstable as "experimental".
      Expect frequent history rewrites.
1.  Verify the cloning: `ls anno-server-22/run_*.sh` — the expected good
    response is `anno-server-22/run_server.sh`.
1.  You may now close the shell for user `annosrv`.
1.  Start a root shell in `/srv/annosrv/anno-server-22`.
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








<!-- Deprecated steps kept around in case we need them again. Please ignore.
### BEGIN deprecated

1.  Ensure you have a user account that has control over the docker daemon.
    You could use `root`, or add yourself to the `docker` group.
    New group memberships only apply at start of a login session, so you may
    need to reconnect SSH, restart your terminal multiplexer, or even reboot.
    1.  Test access to the docker daemon: Run `docker version`
        as the docker-capable user.
    1.  The expected good response should include a section "docker-init:"
        with a "version:" entry.
    1.  If that enty is missing, fix permissions and/or docker.
        Unfortunately, that's ouf of scope for this guide.

### ENDOF deprecated
-- -->

