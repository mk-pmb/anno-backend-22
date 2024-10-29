#!/bin/sh
# -*- coding: utf-8, tab-width: 2 -*-
curl --header 'Remote_User: doi_bot' \
  -- 'http://localhost:33321/anno/by/has_stamp;rss=vh/_ubhd:doiAssign' \
  ; exit $?
