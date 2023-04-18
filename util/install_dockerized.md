
Install using dockerized npm
============================

This script runs dockerized npm and node.js to install the package,
to free you from having to install node and npm on the host system.
It will also fix permissions in case docker unexpectedly mangled them.


How to use
----------

* The script takes no arguments or options.
* The script tries to find the absolute path to the repository.
  * That path MUST NOT contain any `:` (colon) or space characters.
* The npm inside the docker image is usually slightly out of date,
  so it might inform you about ways to upgrade it.
  (Albeit the script tries to disable the update hint.)
  You can ignore this, because it would be useless to install a newer
  npm inside a temporary container.
* The script will also remove a `package.json` if npm has littered the
  repo with it, despite the script trying to prevent the littering.
* The permissions fixing step should be redundant.
  It should affect no files, thus producing no output.
  It is merely an additional safeguard in case the Docker volume option(s)
  used by the script behaved unexpectedly.



