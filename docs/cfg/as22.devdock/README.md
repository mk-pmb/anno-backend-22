
Example DevDock project
=======================


How to install
--------------

If any step seems confusing or doesn't work right away, check its sub items.
Some are for clarification or error handling.

1.  We assume you already have the correct DevDock version installed.
    If you're unsure, refer to the main install instructions.
1.  Open a shell for the anno server user in the DevDock project directory.
    It's probably where this here README resides. It contains a `dock.sh`.
    If the path to here contains `docs/cfg/`, you may have missed a copy step.
    Edit your local copy instead.
1.  If you're reusing an existing DevDock project directory, make sure to
    delete all remnants of your previous service data directories.
    * They are probably in a "hidden" directory (i.e. name starts with a dot)
      like `.containerdata/` inside your DevDock project directory.
    * In case you really want to keep your old Postgres data, you'll have
      to adjust login credentials manually, because when Postgres finds an
      existing users database, it will ignore our new password file.
1.  Adjust the config files in `config/`.
    The most important places are marked with `:maybe_customize:`,
    so you can easily find them with<br>
    `git grep -A 1 -nFe :maybe_customize:`<br>
    and remove the markers from the settings you've dealt with.
1.  Create the initial password files:
    In the project directory, run `./secrets/make_random_passwords.sh`
    * Alternatively, you may configure them manually according to
      the hints in [secrets/.gitignore](secrets/.gitignore).
1.  If you would like to use a Web GUI to manage Postgres,
    `ln --symbolic --target-directory=enabled -- ../avail/adminer.yaml`
    * If your shell completion lacks support for `--target-directory=`,
      you may want to first omit `../`, complete the path, then insert `../`.
1.  If you would like to use the DOI bot,
    `ln --symbolic --target-directory=enabled -- ../avail/doibot.yaml`
1.  You may now close the shell session for the anno server user.
1.  Open a shell session for root.
1.  When you start the project for the first time, the database is not yet
    initialized, so a lot of features are not available yet. We'll fix that
    later. For now, just start the DevDock project's container group.
    (See [the DevDock readme][devdock-readme] for how.)
    * If you get error messages about missing files in `/app`,
      some of the paths in the config files are misconfigured.
    * There should be some Postgres messages about first time startup
      preparations. This should complete within a few minutes.
    * Meanwhile there may be failure messages from the anno server about
      Postgres not responding.
    * When Postgres is ready, the anno server should (re)start automatically
      and print `Now listening.`
      This means it's time to inizialize the database.
1.  Inizialize the database.
    1.  The installation script should have generated a file
        `<anno-server-22 repo path>/util/pg/dbinit_structure.sql`.
        One of the first few lines should be the date of generation.
        (NB: The file was created inside Docker, and Docker might use
        a different time zone than the host.)
        Verify that it matches the time when you installed the server,
        i.e. probably not older than a few minutes.
    1.  Import that file into your database (see below for how).
        It should remove all existing data.
        Which shouldn't matter because in a new install,
        there should not be any previous data.
1.  The docker project is configured for automatic startup.
    Verify this by rebooting your server
    (the "outer" one, that runs the docker daemon)
    and then checking if the anno server is accessible through Apache.
1.  Your anno server should now be ready for use.
    You can find suggestions for a test ride in
    [Working with Annotations](../../working_with_annotations/).




How to control the docker container group
-----------------------------------------

See [the DevDock readme][devdock-readme].

  [devdock-readme]: https://github.com/UB-Heidelberg/docker-devel-util-pmb/tree/master/devdock




How to interact with the database
---------------------------------

<a name="database-commands-docker" id="database-commands-docker"></a>

### Using docker

* Run `docker ps` to determine the name of your Postgres container.
  Usually, it's your DevDock project name + `_postgres_1`.
  For this guide we will assume it's `as22_postgres_1`.
* The `util/pg/` directory of anno-server-22 is mounted into the Postgres
  container as `/asu`, acronym for "anno-server's utilities".
* To get an interactive `psql` (Postgres command line) session:
  `docker exec --tty --interactive as22_postgres_1 /asu/psql`
* To run a single command, e.g. to test whether the database is alive:
  `docker exec as22_postgres_1 /asu/c 'SELECT NOW();'`
* To import an SQL file from the `util/pg/` folder, e.g. the database
  initialization file (see warnings above):
  `docker exec as22_postgres_1 /asu/f dbinit_structure.sql`
* To dump the entire anno database for backup:
  initialization file (see warnings above):
  `docker exec as22_postgres_1 /asu/export`
  * It's basically `pg_dump` with some recommended default options.
    If you want `pg_dump` with only mandatory options applied,
    you can use `/asu/pg_dump`.
    * This might be useful if you want to also export the table structure,
      probably in case you have customized it beyond what was created by
      the database initialization file.




### Using Adminer

* Navigate your browser to the public URL of your Adminer.
  If you have configured a public IP address in the `adminer_dkport` setting,
  it might be directly accessible; otherwise, you'll need to configure your
  firewall, a tunnel and/or `mod_proxy` to gain access.
* In the login form, select database type "Postgres". Unfortunately, we have
  not yet found a way to make the login form pre-select this by default.
  * One way of explicitly selecting the database type is to set the
    URL query part to `?pgsql=postgres`. You can use this for bookmarks.
* As the password, enter the Postgres password as configured in `secrets/`.
  All other fields should have the coorect values by default. Click "Login".
* Explore a bit on your own.
  For more guidance, see [the Adminer website](https://www.adminer.org/).









