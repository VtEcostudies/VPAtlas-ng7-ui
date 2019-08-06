import { Injectable } from '@angular/core';
//import * as AWS from 'aws-sdk/global';
import * as S3 from 'aws-sdk/clients/s3';
import { v4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class AwsS3Service {
  region = 'us-east-1';
  credentials = null;
  //s3: S3 = null;
  bucket = null;

  constructor() {
    //this.credentials = new AWS.SharedIniFileCredentials(); //({profile: 'work-account'});
    //AWS.config.credentials = this.credentials;
    //AWS.config.region = this.region;
    this.credentials = {
      aws_access_key_id: "",
      aws_secret_access_key: ""
    };
    //this.useBucket();
  }

  public createBucket(bucketName=null) {
    if (!bucketName) {
      bucketName = 'VPAtlas-' + v4();
    }
    this.bucket = new S3({ apiVersion: '2006-03-01' });
    this.bucket.createBucket({Bucket: bucketName}, (err, data) => {
      if (err) {
        console.log('Error creating s3 bucket', bucketName, err);
      } else {
        console.log('Success creating s3 bucket', bucketName, data);
      }
    });
  }

  public useBucket(bucketName=null) {
    if (!bucketName) {
      bucketName = 'VPAtlas.data'
    }
    this.bucket = new S3({
      apiVersion: '2006-03-01',
      region: 'us-east-1',
      credentials: this.credentials,
      params: {Bucket: bucketName}
    });
    console.log('useBucket', this.bucket);
  }

  public getObject(bucketName=null, objectName='test.txt') {
    if (bucketName){ //amend the call object to specify optional bucket o'e use the default
    }
    var obj = this.bucket.getObject({Key:objectName});
    console.log('getObject', obj);
  }

  public uploadFile(file) {
    const contentType = file.type;
    /*
    const bucket = new S3(
          {
              accessKeyId: 'YOUR-ACCESS-KEY-ID',
              secretAccessKey: 'YOUR-SECRET-ACCESS-KEY',
              region: 'YOUR-REGION'
          }
      );
      */
      var params = {
          //Bucket: 'YOUR-BUCKET-NAME',
          Key: file.name + v4(),
          Body: file,
          ACL: 'public-read',
          ContentType: contentType
      };

      this.bucket.upload(params, function (err, data) {
          if (err) {
              console.log('There was an error uploading your file: ', err);
              return false;
          }
          console.log('Successfully uploaded file.', data);
          return true;
      });

      //for upload progress
      /*bucket.upload(params).on('httpUploadProgress', function (evt) {
          console.log(evt.loaded + ' of ' + evt.total + ' Bytes');
      }).send(function (err, data) {
          if (err) {
              console.log('There was an error uploading your file: ', err);
              return false;
          }
          console.log('Successfully uploaded file.', data);
          return true;
      });*/
    }
}
