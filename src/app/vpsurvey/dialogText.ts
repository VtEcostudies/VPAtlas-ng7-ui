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
`,
surveyS123Load_Offset:`
<h3><u>VPMon S123 API Data Load - Offset</u></h3>
<p>This utility loads data from an ERSI Arcgis Online Service.</p>
<p>It loads survey data by requesting ESRI Object IDs, which corrrespond to surveys. There are many, probably too many
to load all at once.</p>
<p>To load a specific survey's data, set this value to that survey's Object ID.</p>
<p><u>Offset</u> is the ordinal Object ID value to start loading data from.</p>
<p></p>
`,
surveyS123Load_Limit:`
<h3><u>VPMon S123 API Data Load - Limit</u></h3>
<p>This utility loads data from an ERSI Arcgis Online Service.</p>
<p>It loads survey data by requesting ESRI Object IDs, which corrrespond to surveys. There are many, probably too many
to load all at once.</p>
<p>Use this value to load sets of surveys. If you want to load a single survey, set this value to 1.</p>
<p><u>Limit</u> is the ordinal number of Object IDs to load.</p>
<p></p>
`,
surveyS123LoadUpdate:`
<h3><u>VPMon S123 API Data Load - Overwrite existing data?</u></h3>
<p>This utility loads data from an ERSI Arcgis Online Service.</p>
<p>Initially, <u>Overwrite</u> is a typical choice because data flows from S123 visits into VPAtlas.</p>
<p>When/if VPAtlas provides WebApp editing of Visit Data, this option will become important.</p>
<p>If you do NOT select 'yes' to overwrite data, you will see errors like
<li>
'duplicate key value violates unique constraint "vpvisit_unique_globalId"'
</li>
when an S123 Survey has been previously loaded.`,
surveyS123Service:`
<h3><u>VPMon S123 API Data Load - S123 Survey Service ID</u></h3>
<p>
This utility loads data from an ERSI Arcgis Online Service.
</p><p>
Choose the S123 Service ID you'd like to upload VPMon data from.
</p><p>
Over time, the VPMon S123 App evolves with the inclusion of new
data fields, different data definitions, etc. When that occurs, ESRI
forces us to create a new S123 Service.
</p><p>
VPAtlas stores the data for each uploaded S123 VPMon Survey record with its
Service ID. This allows VPAtlas to maintain the data structure that each
S123 Survey used when it was uploaded.
</p>
`
};
