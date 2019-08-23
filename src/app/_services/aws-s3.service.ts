import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { first } from 'rxjs/operators';
import { environment } from '@environments/environment';
//import { AlertService } from '@app/_services';
import * as AWS from 'aws-sdk';
import * as S3 from 'aws-sdk/clients/s3';
import { v4 } from 'uuid';

@Injectable({
  providedIn: 'root'
})
export class AwsS3Service {
  s3Info = null; //s3 bucket config info
  credentials = null;
  bucket = null;

  constructor(private http: HttpClient) {
    //this.credentials = new AWS.SharedIniFileCredentials({profile: 'default'});
    //console.log('aws-s3-service', this.credentials);
    this.useBucket();
  }

  private getS3Info(bucketName='vpatlas.data') {
    return this.http.get<any>(`${environment.apiUrl}/aws/s3/bucket/${bucketName}`);
  }

  public useBucket(bucketName='vpatlas.data') {

    this.getS3Info(bucketName)
    .pipe(first())
    .subscribe(
        data => {
          this.s3Info = data.rows[0];
          this.s3Info.apiVersion = '2006-03-01';
          this.s3Info.params = {Bucket: bucketName};
          //console.log('useBucket s3Info', this.s3Info);
          this.bucket = new S3(this.s3Info);
        },
        error => {
          console.log('getS3Info error:', error);
        });

/*
    this.bucket = new S3({
      apiVersion: '2006-03-01',
      region: 'us-east-1',
      credentials: this.credentials,
      params: {Bucket: bucketName}
    });
    console.log('useBucket s3Info', this.s3Info);
    this.bucket = new S3(this.s3Info);
    console.log('useBucket', this.bucket);
*/
  }

  public getPhoto(objectKey=null) {
    var params = {
     Bucket: "vpatlas.data",
     Key: objectKey
    };

    this.bucket.getObject(params, function(err, data) {
      if (err) {
        console.log(err, err.stack); // an error occurred
        return null;
      } else {
        console.log(data);           // successful response
        return data;
      }
    });
  }

  public uploadFile(file, poolId) {
    const contentType = file.type;
/*
    const bucket = new S3({
      apiVersion: '2006-03-01',
      region: 'us-east-1',
      accessKeyId: 'AKIA377XAEZJWMGYEAN7',
      secretAccessKey: '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'
    });
*/
    var params = {
      Bucket: 'vpatlas.data',
      Key: poolId,
      Body: file,
      ContentType: contentType
    };
/*
    this.bucket.upload(params, function (err, data) {
      if (err) {
          console.log('There was an error uploading your file: ', err);
          return false;
      }
      console.log('Successfully uploaded file.', data);
      return true;
    });
*/

    //for upload progress
    this.bucket.upload(params).on('httpUploadProgress', function (evt) {
        console.log(evt.loaded + ' of ' + evt.total + ' Bytes');
    }).send(function (err, data) {
        if (err) {
            console.log('There was an error uploading your file: ', err);
            return false;
        }
        console.log('Successfully uploaded file.', data);
        return true;
    });

  }

  public createBucket(bucketName=null) {
    if (!bucketName) {
      bucketName = 'vpatlas.' + v4();
    }
    this.bucket = new S3({ apiVersion: '2006-03-01' });
    this.bucket.createBucket({Bucket: bucketName}, (err, data) => {
      if (err) {
        console.log('Error creating s3 bucket', bucketName, err);
        return null;
      } else {
        console.log('Success creating s3 bucket', bucketName, data);
        return bucketName;
      }
    });
  }

}
