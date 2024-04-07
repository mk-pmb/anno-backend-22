
Example instance config
=======================

Scope
-----

* An instance config is the part of configuration that deals with actual
  annotations.
* For lower level technical plumbing about paths, network connectivity
  etc., see [the example docker config](../as22.devdock/config/).



Structure
---------

* __Instance config__ is divided into __config topics__.
* Each config topic is a YAML dictionary that maps (non-empty)
  __entry names__ to __entry details__.
* A config topic may also have __server-wide settings__ that are given as
  the value for the empty string key of the config topic's YAML dictionary,
  but are not considered to be an entry.
* Each config topics YAML dictionary may be given as a single file or is
  merged from multiple files.
  This will be explained below in section "Config merging".


Available config topics
-----------------------

* [`users`](users/):
  Identities of people that are allowed to do things.
* [`acl_chains`](acl_chains/):
  Rules for deciding who may do what. (acl = Access Control List)
* [`acl_user_groups`](acl_user_groups/):
  Groups users together to simplify ACL rules.
* [`identity_providers`](identity_providers/):
  How the anno server can detect users' identity.
* [`services`](services/):
  Acceptable URL namespaces for annotation targets.
* [`custom_data`](custom_data/):
  Unused namespace for easy injection of structured site-specific data.



#### Detailed information on each topic

Documentation for the example config is scattered throughout the files
in the subdirectories next to this readme.
You should probably read all of them.
Or you could ignore them and try the defaults until you encounter
something that doesn't work.



#### Notes on topic names

* __Why does the `users` folder not have an `acl_` prefix?__
  <br>Because the user configs include aspects unrelated to the ACL,
  like author identities.
  A user config may even be empty, thus conveying no ACL information at all.

* __Why does the `acl_user_groups` have the `acl_` prefix?__
  <br>Because these groups are only used in ACL context.
  This specificity in naming allows for future additions of other kinds
  of user groups.



Config merging
--------------

### Monolithic files

The most straight-forward way of providing the information for a config topic
is to put all of it into a single YAML file named `<topic name>.yaml`
(e.g. `users.yaml`) into the instance config directory itself.



### Topic directories with modular files

A more modular approach, and potentially more easy to track with
version control software (e.g. git), is to make __topic directories__
Those are subdirectories of the instance config directory.
The names of those subdirectories have to exactly match the topic names.

Each topic directory must contain at least one YAML file,
and each of these YAML files must contain a dictionary with either
server-wide settings (top-level in the YAML is a single, empty string key)
or at least one entry.

* ⚠ Enties and server-wide settings can be combined in the same file,
  but using this mechanism is strongly discouraged.

All of the topic's server-wide settings, and all of its entries, are merged
into a single dictionary. This is done by processing the data from all the
YAML files in alphabetical order of the filenames the data comes from.

* ⚠ It is possible for a later file to update specific details on an entry
  that was introduced by a file processed earlier,
  but using this mechanism is strongly discouraged.



### Entry name special effects

* When an entry name is read from a file in a topic directory,
  any U+005E circumflex accent (^) character will be replaced with
  the basename¹ of its origin file. (¹ No path and no `.yaml` extension.)
  * This may be useful to avoid duplication of content in the filename.
  * Example: [`users/arno.yaml`](users/arno.yaml) uses `^` to define the
    entry named `arno`.







