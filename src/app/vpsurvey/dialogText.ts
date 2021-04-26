/*
  NOTES:

  - To enable modal dialogs, you must declare the jw-modal in your html source like this:

      <jw-modal id="vpsurvey_help_info">
          <button (click)="closeModal('vpsurvey_help_info');">Close</button>
      </jw-modal>

  - And, you must import the Modal Service like this:

    private modalService: ModalService

  - And, you must inject that service into your Constructor like this:

    ... , private modalService: ModalService, ...

  - And, you must add the following functions to your source js/ts like this:

    openModal(id: string, infoId=null) {
        console.log('infoId', infoId);
        this.modalService.open(id, surveyDialogText[infoId]);
    }

    closeModal(id: string) {
        this.modalService.close(id);
    }
*/
export const surveyDialogText = {

surveyUserName:`
<h3><u>Vernal Pool Survey User Name</u></h3>
<p>Survey User Name is the name of person who uploads Survey data.</p>
<p>This is not necessarily the same as the Survey Observer User Names, the individuals
who conducted the field Survey of Vernal Pool data.</p>
`,
surveyUploadUpdate:`
<h3><u>OVERWRITE SURVEY DATA</u></h3>
<p></p>
<p>DO YOU WANT TO OVERWRITE ANY MATCHING SURVEY DATA RECORDS WITH UPDATED DATA?</p>
`,
surveyUploadFile:`
<h3><u>Vernal Pool Survey Data Upload File</u></h3>
<p>Select the file on your computer which contains Vernal Pool Survey Data to upload.</p>
<p>This file must conform exactly to the Survey-data upload file format,
<a href="https://vpatlas.org/survey_data_upload_format.html">found here.</a>
</p>
`
};
