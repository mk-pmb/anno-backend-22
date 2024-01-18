// -*- coding: utf-8, tab-width: 2 -*-

import makeStampDeleter from '../util/makeStampDeleter.mjs';
import miscMetaFieldInfos from '../miscMetaFieldInfos.mjs';

const stType = miscMetaFieldInfos.doiRequestStampName;
const delDoiReq = makeStampDeleter.fromCtxProp(stType);

const EX = {
  deleteDoiRequestStamp: delDoiReq,

  prepareAdd: delDoiReq,
};


export default EX;
