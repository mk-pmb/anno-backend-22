
Example DevDock project
=======================


How to install
--------------

1.  Follow [config/README.md](config/README.md).
1.  Make DevDock available:
    1.  Clone at least the `devdock` directory of [this repo
        ](https://github.com/mk-pmb/docker-devel-util-pmb/tree/master/devdock)
        (or the entire repo) to somewhere where at least the anno server
        user can read it.
    1.  Check the version in `package.json` (should be near the top).
        Versions 0.2.x should work. At time of writing (2023-04-17),
        this is the latest.
    1.  Make a symlink `/usr/local/bin/docker-devdock` that points to
        DevDock's `devdock.sh`.
1.  Create the initial password files:
    run `./secrets/make_random_passwords.sh`
    * Alternatively, you may configure them manually according to
      the hints in [secrets/.gitignore](secrets/.gitignore).
1.  If you would like to use a Web GUI to manage Postgres,
    `ln --symbolic --target-directory=enabled -- ../avail/pgadminer.yaml`
1.  When you start the DevDock project for the first time,
    the database is not yet initialized, so a lot of features are not
    available yet. Start it anyways.
    * There should be some Postgres messages about first time startup
      preparations. This should complete within a few minutes.
    * Meanwhile there may be failure messages from the anno server about
      Postgres not responding.
    * When Postgres is ready, the anno server should (re)start automatically
      and print `Now listening.`
      This means it's time to inizialize the database.
1.  Inizialize the database.
    1.  The installation script should have generated a file
        `<repo path>/util/dbinit_structure.sql`.
        One of the first few lines should be the date of generation.
        (NB: Docker might use a different time zone than the host.)
        Verify that it matches the time when you installed the server,
        i.e. probably not older than a few minutes.
    1.  Import that file into your database (see below for how).
        It should remove all existing data.
        Which shouldn't matter because in a new install,
        there should not be any previous data.




How to control the docker container group
-----------------------------------------

* start in foreground: `./dock.sh`
* start in background: `./dock.sh bgup`
* clean shutdown: `./dock.sh down`



How to interact with the database
---------------------------------


Using docker
~~~~~~~~~~~~

* Run `docker ps` to determine the name of your Postgres container.
  Usually, it's your DevDock project name + `_postgres_1`.
  For this guide we will assume it's `as22_postgres_1`.
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




Using pgAdminer
~~~~~~~~~~~~~~~

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









