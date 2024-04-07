

Example docker config
=====================

Scope
-----

* The docker config decides low-level technical plumbing about paths,
  network connectivity etc.
* For the part of configuration that deals with actual annotations,
  see [the example instance config](../../ubhd-ex01/).



How to use
----------

* To read about available config options, please read the comments in
  all the other files in this directory.
* For how and where to install docker config files, please refer to
  [`../README.md`](../README.md).
* Changes to the docker config settings take effect the next time the
  container group is (re-)created.
  DevDock automatically does that when you start the project
  (`./dock.sh bgup` or `./dock.sh up`).





