#!/bin/bash
# -*- coding: utf-8, tab-width: 2 -*-


function ubhd_diglit_remix () {
  export LANG{,UAGE}=en_US.UTF-8  # make error messages search engine-friendly
  local ANNO_SRV="$1"; shift
  case "$ANNO_SRV" in
    *:* | */* ) ;;
    lh | '' ) ANNO_SRV='http://localhost:33321/';;
    [a-z]*[0-9] )
      ANNO_SRV="https://serv$ANNO_SRV.ub.uni-heidelberg.de/anno-test/";;
  esac

  [ "$#" == 0 ] && set -- cpg148/ 0074 cpg389/ 0015 0023 0035

  local CANVAS_SED='
    /^ *\{$/N
    s~^( *\{)\n\s+~\1 ~
    s~" +:~":~g
    s~\s+$~~
    '

  CANVAS_SED+='s~ {3}~  ~g
    ' # Normalize weird 3-space indentation from CPAN module JSON::XS

  echo | sed -re "$CANVAS_SED" >/dev/null || return 4$(
    echo E: bad CANVAS_SED >&2)

  local DEST_FN='tmp.remix.manifest.json'
  local MANIF_URL=
  # MANIF_URL="https://anno.example.net/mirador3/$DEST_FN"
  ( echo '{ "@context": "http://iiif.io/api/presentation/3/context.json",'
    [ -z "$MANIF_URL" ] || echo '  "id": "'"$MANIF_URL"'",'
    printf -- '  "%s": "%s",\n' \
      type Manifest \
      viewingDirection 'left-to-right' \
      rights 'http://creativecommons.org/publicdomain/mark/1.0/deed.de' \
      ;
  ) >"$DEST_FN" || return $?
  printf -- '  "%s": %s\n' \
    behavior '["paged"],' \
    items '[' \
    >>"$DEST_FN" || return $?
  local CANVAS_COMMA=

  local BOOK='no_book'
  local ARG=
  while [ "$#" -ge 1 ]; do
    ARG="$1"; shift
    [ "$ARG" == "${ARG/'/'/}" ] || BOOK="${ARG%/*}"
    ARG="${ARG##*/}"
    [ -n "$ARG" ] || continue
    add_one_page "$BOOK" "$ARG" || return $?
  done

  echo $'\n  ]\n}' >>"$DEST_FN" || return $?
  jsl "$DEST_FN" || return $?
}


function add_one_page () {
  local BOOK="$1" PAGE="$2"
  local URL="https://digi.ub.uni-heidelberg.de/diglit/iiif3/$BOOK/canvas/$PAGE"
  local JSON="$(curl --silent "$URL" | sed -re "$CANVAS_SED")"
  local WIDTH='s~^ +"width" *: *([0-9]+),?$~\1~p'
  WIDTH="$(echo "$JSON" | sed -nre "$WIDTH" | sort -gu | tail -n 1)"
  local INDENT='    '
  JSON="$INDENT${JSON//$'\n'/$'\n'$INDENT}"

  local ANNO_OLD=";fmt=iiif3/"
  local ANNO_NEW="${ANNO_OLD%/};scaleTargetWidth=$WIDTH/"
  JSON="${JSON/"$ANNO_OLD"/"$ANNO_NEW"}"

  ANNO_OLD='https://anno.ub.uni-heidelberg.de//anno/'
  ANNO_NEW="${ANNO_SRV}anno/"
  JSON="${JSON/"$ANNO_OLD"/"$ANNO_NEW"}"

  ANNO_OLD='"annotations": []'
  ANNO_NEW="${ANNO_SRV}anno/by/subject_target;fmt=iiif3;"
  ANNO_NEW+="scaleTargetWidth=$WIDTH"
  ANNO_NEW+="/https://digi.ub.uni-heidelberg.de/diglit/$BOOK/$PAGE"
  ANNO_NEW='"annotations": [
          { "id": "'"$ANNO_NEW"'",
            "type": "AnnotationPage"
          }
       ]'
  JSON="${JSON/"$ANNO_OLD"/"$ANNO_NEW"}"

  echo -n "$CANVAS_COMMA$JSON" >>"$DEST_FN" || return $?
  CANVAS_COMMA=$',\n'
}










ubhd_diglit_remix "$@"; exit $?
