
Worum geht es hier?
===================

Kurz gesagt: Software zur Speicherung von Web-Annotationen.



Was bedeutet das?
-----------------

Wir stellen digitale Infrastruktur bereit, damit Menschen vielfältige Arten
historischer Dokumente so annotieren können, dass die Annotationen sich für
wissenschaftliche Arbeit eignen.

Annotieren bedeutet hierbei, einen Betrachtungsgegenstand auf formale Weise
zu kommentieren. Im Kontext unserer Universitäts-Bibliothek nutzen Leute das
z.B. um [Fotos geographisch einzuordnen][anno-yellowstone] oder um
[historische Hintergründe von Kunstverkäufen aufzuzeigen][anno-goethesammlung].

  [anno-yellowstone]: https://anno.ub.uni-heidelberg.de/anno/Mkwn1Qi6SLqBGra2BAbE5Q
  [anno-goethesammlung]: https://anno.ub.uni-heidelberg.de/anno/JjzPpSUsTJ6htQji6kbKSA


Der sichtbare Anteil wird von der Software
["anno-frontend"](https://github.com/mk-pmb/anno-frontend/)
bereitgestellt.
Diese Software sorgt dafür, dass Bildbereiche hervorgehoben und ausgewählt
werden können, und dass man die Kommentare zu diesen Bereichen lesen kann.
Ausgewählten Autoren gibt sie zusätzlich die Möglichkeit, neue Bereiche
einzuzeichnen und den neu gewählten Bereich zu kommentieren.

Diese Kommentare müssen irgendwo auf Servern gespeichert werden.
Das ist der unsichtbare Anteil, den zur Zeit (Juli 2022) die Software
["anno-backend"](https://github.com/ub-heidelberg/anno-backend)
übernimmt.

Wegen diverser technischer Einschränkungen im alten System entwickeln wir
allerdings eine Nachfolge-Software, um die Annotationen noch effizienter
speichern zu können und auf neue Weisen verfügbar zu machen.
Dieser Nachfolger heißt "anno-server-22" und das ist dieses Projekt hier.



Wann wird die neue Software betriebsbereit sein?
------------------------------------------------

Siehe dazu [unsere Planungsdokumente][anno-ausblick].

  [anno-ausblick]: https://github.com/mk-pmb/anno-ausblick




