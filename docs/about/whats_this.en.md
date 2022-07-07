
What is this project?
=====================

In short: It's a storage software for web annotations.


What does that mean?
--------------------

We provide digital infrastructure to enable people to annotate various
kinds of historic documents in a way that is useful for academic activities.

Annotating is basically a formal way of commenting on something.
In our university library context, people might for example
[clarify the location of a photograph][anno-yellowstone]
or [give historical background on art sales][anno-goethesammlung].

  [anno-yellowstone]: https://anno.ub.uni-heidelberg.de/anno/Mkwn1Qi6SLqBGra2BAbE5Q
  [anno-goethesammlung]: https://anno.ub.uni-heidelberg.de/anno/JjzPpSUsTJ6htQji6kbKSA


The visible part is powered in part by
["anno-frontend"](https://github.com/mk-pmb/anno-frontend/)
— that is the software that makes it so you can see areas of the
images highlighted, and read the comments for those areas.
For authorizes scholars, it also provides the ability to mark parts of
the image and write a new comment for that part.

Those comments have to be stored on some computer somewhere.
That is the invisible part, and is currently (July 2022) provided by
["anno-backend"](https://github.com/ub-heidelberg/anno-backend).

Due to technical limitations in that software, we're in the process of
building a new replacement for the storage part.
That new replacement is called "anno-server-22" and it's this project.



When will the new software be ready?
------------------------------------

Please refer to our [german-language planning documents][anno-ausblick].

  [anno-ausblick]: https://github.com/mk-pmb/anno-ausblick




