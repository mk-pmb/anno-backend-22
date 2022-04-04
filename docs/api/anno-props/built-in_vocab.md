
Use of anno-vocab built-in namespaces
=====================================

Why prefer built-in namespaces over an Extension?
-------------------------------------------------

The [Web Annotation Vocabulary][anno-vocab]'s
["Extensions" chapter][anno-vocab-extensions]
describes how to add custom terms.
It also warns that it's an additional burden to clients to download and
process non-standard vocabularies.
It thus recommends to search the namespaces included in anno-vocab for
whether a suitable property might exist in there, and to prefer built-in
terms where possible.

  [anno-vocab]: https://www.w3.org/TR/annotation-vocab/#extensions
  [anno-vocab-extensions]: https://www.w3.org/TR/annotation-vocab/#extensions

Discussions about which of the built-in vocabularies is suited best
for which use case can be found here:

  * [How to hint at previous versions of an annotation?](https://github.com/w3c/web-annotation/issues/446)



Anno-model doesn't mention the namespace used. Where is it specified?
---------------------------------------------------------------------

The [Web Annotation Model][anno-model]'s
["Other Properties" chapter][anno-model-other-props]
has a note that authorizes use of any properties that conform to
the [Web Annotation Vocabulary][anno-vocab]'s
["Extensions" chapter][anno-vocab-extensions].

  [anno-model]: https://www.w3.org/TR/annotation-model/
  [anno-model-other-props]: https://www.w3.org/TR/annotation-model/#other-properties

The "Extensions" chapter protects its built-in namespaces:

<blockquote>
Extension contexts MUST NOT redefine existing JSON-LD keys
from the Web Annotation context.
</blockquote>

…, so we can trust that "ontologies that are already included" refers to
[anno-vocab's "Namespaces" chapter](https://www.w3.org/TR/annotation-vocab/#namespaces).




Why prefer `as:items`/`partOf` over `dcterms:hasPart`/`isPartOf`?
-----------------------------------------------------------------

:TODO: (also `skos:`)



