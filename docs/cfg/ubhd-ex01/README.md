
Example config
==============

Documentation for the example config is scattered throughout the files.
You should probably read all of them.
Or you could ignore them and try the defaults until you encounter
something that doesn't work.



Folder names
------------

* __Why does the `acl_user_groups` have the `acl_` prefix?__
  <br>Because these groups are only used in ACL context.
  This specificity in naming allows for future additions of other kinds of
  user groups.

* __Why does the `users` folder not have an `acl_` prefix?__
  <br>Because the user configs include, aspects unrelated to the ACL,
  like author identities.
  A user config may even be empty, thus conveying no ACL information at all.




