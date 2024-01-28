
User Login Security
===================

When configuring the annotation server to use usernames, it will expect
to see an HTTP header with a name of your choice that holds the username
or some text from which the (external ¹) username can be extracted.

Thus, your reverse proxy's duty is two-fold:

* 📇 To proxy-forward such an HTTP header if a user is identified.
  * For guest access, the header may be omitted or empty.
* 🛡 To prevent any untrusted user-provided HTTP headers of that name
  from being forwarded directly to the HTTP interface of `anno-server-22`.
  (Because Node.js would not be able to detect whether the reverse proxy had
  _set_ the header or just _forwarded_ it.)
  * One way to achieve this is to use Apache with the
    [RequestHeader directive](https://httpd.apache.org/docs/2.4/mod/mod_headers.html)
    with action "unset".
  * You'll need to unset all combinations of dashes and underscores, e.g. both
    `RequestHeader unset Remote-User` and `RequestHeader unset Remote_User`.
    (Our HTTP library in Node.js translates all dashes to underscores.
    Thus, any combination could potentially be used to confuse it,
    and we must defend against all of them.)


Also:

* 🔥 Make sure your firewall and network setup is such that the annotation
  server can only be reached by applications whom you can trust about what
  username header they send.

* ¹) When using Shibboleth, external usernames can be rather cryptic.
  To help with that, the annotation server has an alias feature that can map
  external usernames to internal ones ("anno user") of your choice.









