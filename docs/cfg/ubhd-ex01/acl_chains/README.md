
ACL chains
==========

Policy concepts
---------------

An ACL __rule__ has at least one __effect__, and at least one __condition__
for when the effect(s) shall apply.
Conditions have at least one __criterion__.

A __decision value__ is either `allow` and `deny`.

An ACL __chain__ is a list of rules.
By default, processing starts with the chain named `main`.
The purpose of evaluating ACL chains is to look up a decision value for a
given __privilege name__, which thereby becomes the __desired privilege__.
(Currently, "desired" seems too weak a word because the server only supports
the strongest level thereof: "required privilege".
However, in future versions, we're planning support for
"alternative privileges".)

* see also: [List of all currently supported privileges](privileges.md)

A __decision__ is a pair of a privilege name and a decision values, given as
an entry in the dictionary of the `decide` effect.
The name (key) of these entries should be a privilege name.
A __matching decision__ is a decision whose name matches the desired privilege.
It sets the final decision value. This immediately terminates ACL processing.
The reserved special name `*` is used to optionally express a
__fallback decision__ that will substitute for a matching decision if there
was none, thus immediately deciding any other privilege not mentioned.

A __tendency__ is most like a decision, but only takes effect if the ACL
processing ends without having reached a decision. It is given in the
dictionary of the `tendency` effect.
A __matching tendency__ is a tendency whose name matches the desired privilege.
A __fallback tendency__ is similar to the fallback decision, but since
tendencies do not stop ACL processing, it can still be overruled by a later
matching tendency, a matching decision, or even a fallback decision.

The __default policies__ are tendencies defined in server code.
It's best to not rely on them.



Meta data templates
-------------------

In some places, a __meta data template__ can be used. It is specified as
a string and can use slot markers in the form of `<$slotName>`.
To figure out the slot names, see `debugDumpMeta` below.



Conditions
----------

Each rule must specity a condition. The requirement for expressly writing it
even in the trivial case of `if: always` is meant to help prevent YAML editing
accidents.
If you track your config in git (recommended), it will also help `git blame`
find which commit had removed the previous.

A __condition key__ is one of:

| C. key      | Parameter         | Rule is skipped if…       |
|------------ |------------------ |-------------------------- |
| `if`        | single criterion  | the criterion is unmet.   |
| `ifAll`     | list of criteria  | any criterion is unmet.   |
| `ifAny`     | list of criteria  | all criteria are unmet.   |
| `unless`    | single criterion  | the criterion is met.     |
| `unlessAll` | list of criteria  | all criteria are met.     |
| `unlessAny` | list of criteria  | any criterion is met.     |

A rule can only have one of the `if…` condition keys
and only one of the `unless…` keys.



Criteria
--------

### `always`

Takes no argument. Is always met.



### `never`

Takes no argument. Is always unmet.



### `isLoggedIn`

Takes no argument. Is met when the session has an anno username.



:TODO: Explain other available criteria.




Effects
-------

### `decide`, `tendency`

Described above in "Policy concepts".
Expected value: A dictionary of decisions.


### `aclSubChain`

Run (an)other ACL chain(s).
Expected value: Name(s) of the subchain(s) to run.

* Names can be a string or a list of strings.
* All names are given as meta data templates.
* If the name starts with a question mark (`?`), it is stripped and instead
  the entry is considered opportunistic, which means it is silently skipped
  if no ACL chain with that name exists.



### `sideEffects`

Miscellaneous debug behaviors.
Expected value: A list of dictionaries that each have a `:` key identifying
the actual side effect desired. Currently, these are supported:

* `debugDumpMeta`: Print all current ACL meta data to the server log.















:TODO: Explain other available effects.


