
<!--#echo json="package.json" key="name" underline="=" -->
anno-server-22
==============
<!--/#echo -->

<!--#echo json="package.json" key="description" -->
UB-HD Web Anntation Server, 2022 Edition
<!--/#echo -->

* 🇺🇸 [What is this project?](docs/about/whats_this.en.md)
  / 🇩🇪 [Worum geht es hier?](docs/about/whats_this.de.md)



Installation
------------

* [Install Guide](docs/install/)



Configuration overview
----------------------

* [Docker config](docs/cfg/as22.devdock/config/):
  Paths, network connectivity etc.

* [Instance config](docs/cfg/ubhd-ex01/):
  Everything about annotations, users and permissions.
  * Quick jump: [`services`](docs/cfg/ubhd-ex01/services/)
    · [`users`](docs/cfg/ubhd-ex01/users/)
    · [`acl_chains`](docs/cfg/ubhd-ex01/acl_chains/)
    · [`acl_user_groups`](docs/cfg/ubhd-ex01/acl_user_groups/)
    · [`identity_providers`](docs/cfg/ubhd-ex01/identity_providers/)

* Shortcuts for external projects' config docs:
  * [anno-doi-bot-23][doibot23] &rarr;
    [last known config docs][doibot23cfg]
  * [anno-frontend][anno-fe] &rarr;
    [experimental config docs][anno-fe-ex-cfg]



  [doibot23]: https://github.com/mk-pmb/anno-doi-bot-23/
  [doibot23cfg]: https://github.com/mk-pmb/anno-doi-bot-23/blob/master/funcs/cfg.default.rc
  [anno-fe]: https://github.com/mk-pmb/anno-frontend/
  [anno-fe-ex-cfg]: https://github.com/mk-pmb/anno-frontend/tree/experimental/src/default-config


<!--#toc stop="scan" -->



Known issues
------------

* Needs more/better tests and docs.




&nbsp;


License
-------
<!--#echo json="package.json" key=".license" -->
MIT
<!--/#echo -->
