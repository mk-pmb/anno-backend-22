
ACL privileges
==============

Discovery and reading
---------------------

* `discover`:
  Required for actions that reveal new annotation IDs explicitly given
  in the request.
  * The most prominent use is searching for annotations by target URL.

* `lookupAnnoTargets`:
  Required for actions that reveal the target URLs of an annotation.
  * This privilege is unusual in that it is evaluated not for a target URL,
    but instead for the version ID of the annotaion, given as ACL meta field
    `versId`.
  * Almost every action relies on this, because almost all other ACL checks
    use the target URLs as input, and will thus fail without them.

* `read`:
  Required for actions that reveal the body or non-trivial meta data
  of an annotation.
  * There are not yet any strong guarantees which fields count as
    (non-)trivial meta data, e.g. whether a specialized search is allowed
    to include the `dc:title` field in its results.
    * However, search is supposed to show only very minimalistic preview for
      results for which the user lacks `read` permission.
  * We haven't invested much effort into secrecy verification because in our
    scenario, we allow public read access anyway.



Submission
----------

* `create`:
  Required for creating a new annotation that
  is not a reply to an existing annotation.

* `reply`:
  Required for creating a new annotation that
  is considered a reply to an existing annotation.

* `create_across_services`:
  Required for creating a new annotation with target URLs that match two or
  more [services](../services/).
  Users will additionally need the general `create` or `reply` privilege.



Revision
--------

* `revise_any` / `revise_own`:
  Required submitting a new version of an existing annotation.
  * When the server considers the submitter to be the author of the version
    to be replaced, it will check the `…own` privilege, otherwise the `…any`.
  *

* `revise_any_body` / `revise_own_body`:
  Required in addition to `revise_(own|any)` if the new version
  contains modifications to (any part of) the body.


* `revise_any_creator` / `revise_own_creator`:
  Required in addition to `revise_(own|any)` if the new version
  contains modifications to (any part of) the `creator` field.

* `revise_any_target_add` / `revise_own_target_add`:
  Required in addition to `revise_(own|any)` if the new version
  introduces a new target URL.

* `revise_any_target_del` / `revise_own_target_del`:
  Required in addition to `revise_(own|any)` if the new version
  omits a target URL previously present.



Approval
--------

Only relevant for [services](../services/) that use approval.

* `stamp_any_add_dc_dateAccepted`:
  Required for approving another user's annotation.

* `stamp_own_add_dc_dateAccepted`:
  Required for approving your own annotation.



Depublication / Retraction / Rejection
--------------------------------------

* `stamp_any_add_as_deleted`:
  Required for rejecting another user's annotation waiting for approval,
  or retracting another user's already-approved annotation.

* `stamp_own_add_as_deleted`:
  Required for rejecting your own annotation waiting for approval,
  or retracting your own already-approved annotation.



Admin control
-------------

* `shutdown` (deprecated):
  Required for the shutdown request, which makes the server stop accepting
  new requests and quit after all current requests are served.
  * Deprecated. Instead, stop the docker container or send the TERM signal.



DOI bot compatibility
---------------------

This section is only relevant if you use the `anno-doi-bot-23`.

* `stamp_any_add__ubhd_doiAssign` / `stamp_any_own__ubhd_doiAssign`:
  Required for requesting a DOI to be assigned to an annotation.
  The role of "any" or "own" is the same as for `revise_(own|any)`.
  * In the double `_`, the second `_` is part of the actual stamp name.

* `search_hasStamp__ubhd_doiAssign`:
  Required for searching annotations that are waiting to be assigned a DOI.
  * In the double `_`, the second `_` is part of the actual stamp name.

* `stamp_any_add_dc_identifier`:
  Required for assigning a DOI to an annotation.

* `stamp_own_add_dc_identifier`:
  If you ever need this, something broke very badly.
  Your DOI bot would only need this privilege to assign a DOI to an
  annotation that it (the DOI bot) is considered to be the author of.
  A DOI bot should never submit new annotations.










