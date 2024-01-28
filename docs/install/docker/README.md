
Installing using Docker
=======================

If any step seems confusing or doesn't work right away, check its sub items.
Some are for clarification or error handling.

1.  Recommended OS is Ubuntu focal.
    Any later Ubuntu LTS should work as well.
1.  Shell commands in this tutorial assume you use bash as your shell.
1.  Install:
    * git
    * Docker CE (Community Edition) &rarr; [Docker Ubuntu Install Guide](
      https://docs.docker.com/engine/install/ubuntu/)
    * an apache webserver with `mod_proxy`
      * optionally, some sort of user login mechanism for Apache.
      * [How to configure your Apache](../../cfg/reverse_proxy/apache/)
    * [DevDock
      ](https://github.com/mk-pmb/docker-devel-util-pmb/tree/master/devdock)
      (a templating system for docker-compose).
      * Version 0.2.1 should work. At time of writing (2024-01-09),
        this is the latest.
1.  Make sure that the hostname is configured correctly for use as a
    FQDN (fully-qualified domain name).
    * You can verify this by running `hostname --fqdn` – it should print a
      name that is registered in global DNS, or at least resolvable by all
      computers intended to access the anno server.
    * The FQDN should resolve to a public-facing IP address of the anno server.
    * … even when resolving locally
      (`gethostip --decimal "$(hostname --fqdn)"`)
      or you may run into docker troubles when you try to use additional
      tools like our DOI bot. It's possible to make it work for local
      IP addresses, but we won't cover that here.
1.  Open a shell session for user root.
1.  Create an OS user as which the anno server shall run.
    In this tutorial, we'll assume
    * user name `annosrv`,
    * member of a group with the same name,
    * home directory is `/srv/annosrv`,
    * login disabled &rArr; the only way to get a shell as that user is
      `sudo -su annosrv` or similar.
1.  `chown --recursive annosrv:annosrv -- /srv/annosrv`
1.  Put the root shell aside, we'll need it again later.
1.  Start a shell session as user `annosrv`.
1.  … and `cd` to its home directory if you aren't there yet.
1.  Ensure that user `annosrv` has no control over the docker daemon.
    (Earlier versions of this guide advised the opposite.)
    1.  Test access to the docker daemon: Run `docker version`
    1.  The expected good response should include the message
        "ERROR: Got permission denied while trying to connect to the
        Docker daemon socket".
    1.  If that error message is missing, remove user `annosrv` from all
        docker-related OS user groups and reboot.
1.  If you already have a `/srv/annosrv/anno-server-22` from a previous
    install attempt, move it to some backup directory.
    The next step (cloning) would fail if the directory already exists.
1.  If this were a stable release, you could now
    `git clone https://github.com/mk-pmb/anno-server-22`
    * … but this config example uses the staging branch,
      so to the `clone` command, add: `--single-branch --branch staging`
    * The "staging" is almost as unstable as "experimental".
      Expect frequent history rewrites.
1.  Verify the cloning: `ls anno-server-22/run_*.sh` — the expected good
    response is `anno-server-22/run_server.sh`.



### Intermezzo: DOI bot

If you want DOI registration for your annotations, this optional chapter
shows how to install `anno-doi-bot-23`.
The anno server works perfectly well even without a DOI bot.

1.  If you do not need a DOI bot, jump to the next subchapter "Back to root".
1.  Create a directory for the DOI bot modules.
    We'll assume `/srv/annosrv/doibot`.
1.  `cd /srv/annosrv/doibot`
1.  Clone the main DOI bot repo:
    `git clone --single-branch --branch staging https://github.com/mk-pmb/anno-doi-bot-23`
1.  If you also want the DataCite registry adapter:
    `git clone --single-branch --branch staging https://github.com/mk-pmb/anno-doi-bot-23-adapter-datacite`
1.  Install and configure (don't: start) the DOI bot according to [its readme.
    ](https://github.com/mk-pmb/anno-doi-bot-23)
    * You can skip the steps for cloning (you've just done that)
      and the step for `npm install` (we'll do that soon).
1.  If you chose to install (don't: start) the DataCite registry adapter,
    install and configure it according to [its readme.
    ](https://github.com/mk-pmb/anno-doi-bot-23-adapter-datacite)
    * You can skip the steps for cloning (you've just done that)
      and the step for `npm install` (we'll do that soon).



### Back to root

1.  Put the `annosrv` shell aside for later. Switch back to your root shell.
1.  If you have chosen to do the DOI bot install part above, export an
    environment variable `EXTRAS_DIR` that points to where your DOI bot
    modules are. With the example paths, that would be:
    `export EXTRAS_DIR=/srv/annosrv/doibot`
1.  In that root shell, run:
    `/srv/annosrv/anno-server-22/util/install_dockerized.sh`
    * It will create a temporary node.js docker container, mount the
      `anno-server-22` directory into it, and use npm inside the container
      to arrange various things. (For details about what and why, see
      `util/install_dockerized.md` next to the script.)
    * If you have set an `EXTRAS_DIR`, the script will also install all
      Node.js modules that are subdirectories of `EXTRAS_DIR`.
1.  You may now close the root shell.
    The further configuration should happen as user `annosrv`.
    (Or you can do them as anyone and later `chown` all files.)
1.  One anno server installation can run several instances,
    each with their own docker-internal hostname.
    (The docker project will make its own virtual network with locally
    assigned hostnames, independent of DNS.)
    Choose a hostname for your first instance.
    * It should start with a letter and may consist of letters,
      numbers and hyphens. (No dots. This is not a FQDN.)
    * In this example, we will assume that hostname to be `dkas22`.
      ("dk" = Docker, "as22" = anno-server-22)
    * __You will need this hostname again later.__
1.  Create an anno server instance config.
    That's a subdirectory in the `anno-server-22` directory named
    `cfg.@` + the instance's hostname.
    * An example config directory can be found in
      [../../cfg/ubhd-ex01/](../../cfg/ubhd-ex01/).
      To use it: `cp -rnT -- docs/cfg/ubhd-ex01/ cfg.@dkas22`
    * Directory naming explained: "cfg." = config, "@" = host-specific.
      In the future, there may be others like "cfg.site" and "cfg.vendor".
1.  Customize your instance config.
    See the example config's `README.md` for how.
1.  Now you need to set up docker-compose.
    To make that easier, we use the templating system "DevDock".
    1.  The next steps will require basic knowledge of DevDock, at least
        project/directory names and container control commands.
        You can find them in [the DevDock Readme
        ](https://github.com/mk-pmb/docker-devel-util-pmb/tree/master/devdock).
    1.  A good place to put your DevDock project is inside your
        instance config directory.
    1.  An example config directory can be found in
        [../../cfg/as22.devdock/](../../cfg/as22.devdock/).
        To use it: `cp -rnt cfg.@dkas22/ -- docs/cfg/as22.devdock`
1.  The anno server software itself is now installed.


### Next steps:

* Set up a reverse proxy and ensure some security aspects:
  [see here](../../cfg/reverse_proxy/).
* Prepare the database and start the server:
  See the `README.md` of the example DevDock project.








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

