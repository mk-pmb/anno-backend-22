// -*- coding: utf-8, tab-width: 2 -*-

const EX = {

  doiRequestStampName: '_ubhd:doiAssign',
  doiStampName: 'dc:identifier',
  subjTgtAclField: 'ubhd:aclPreviewBySubjectTargetUrl',
  unapprovedStampName: '_ubhd:unapproved',

};
Object.assign(EX, {

  visibilityRelatedStampsNames: [
    'as:deleted',
    'dc:dateAccepted',
    EX.unapprovedStampName,
  ],

  serverAssignedFields: [ /*
    Fields that are to be assigned by the server MUST NOT be included
    when submitting a new annotation.
    */
    'id',
    'created',
  ],

});
Object.assign(EX, {

  nonInheritableFields: [
    ...EX.serverAssignedFields,
    ...EX.visibilityRelatedStampsNames,
  ],


});


export default EX;
