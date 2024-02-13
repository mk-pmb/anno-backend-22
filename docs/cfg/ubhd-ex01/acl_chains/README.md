
ACL chains
==========

By default, processing starts with the "main" chain.



Conditions
----------

Each rule must specity a condition. The requirement for expressly writing it
even in the trivial case of `if: always` is meant to help prevent YAML editing
accidents.
If you track your config in git (recommended), it will also help `git blame`
find which commit had removed the previous.


:TODO: Explain available conditions.



