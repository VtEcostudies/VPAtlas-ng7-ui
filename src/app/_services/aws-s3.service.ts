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
  basicBucketName = 'vpatlas.data';
  photoBucketName = 'vpatlas.photos';
  soundBucketName = 'vpatlas.sounds';

  constructor(private http: HttpClient) {
    this.useBucket();
  }

  /*
  Get S3 bucket config and access from API
  */
  private getS3Info(bucketName='vpatlas.data') {
    return this.http.get<any>(`${environment.apiUrl}/aws/s3/bucket/${bucketName}`);
  }

  public useBucket(bucketName=this.photoBucketName) {

    this.getS3Info() //get bucket creds from db. use default bucketName to retrieve.
    .pipe(first())
    .subscribe(
        data => {
          this.s3Info = data.rows[0]; //bucket creds
          this.s3Info.apiVersion = '2006-03-01'; //add api version
          this.s3Info.params = {Bucket: bucketName}; //add bucket name
          //console.log('useBucket s3Info', this.s3Info);
          this.bucket = new S3(this.s3Info); //instantiate bucket with access
        },
        error => {
          console.log('getS3Info error:', error);
        });
  }

  public getPhoto(objectKey=null) {
    var params = {
     Bucket: this.photoBucketName,
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

  public async uploadPhoto(file, poolId, visitId=null, type='Pool', iter=1, cbProgress=null) {
    const contentType = file.type;
    var folderPath = `${poolId}/`
    var fileName = `${type}.${iter}`;

    if (visitId) {
      folderPath += `${visitId}/`;
    }

    var params = {
      Bucket: this.photoBucketName,
      Key: folderPath + fileName,
      Body: file,
      ContentType: contentType
    };

    if (!cbProgress) {
      cbProgress = function (evt) {
            console.log(evt.loaded + ' of ' + evt.total + ' Bytes');
        };
    }
    //https://aws.amazon.com/blogs/developer/support-for-promises-in-the-sdk/
    //return this.bucket.upload(params).promise();
    //var upload; var promise = (upload = this.bucket.upload(params)).promise();
    //var upload = this.bucket.upload(params); var promise = upload.promise();
    var upload = this.bucket.upload(params);
    upload.on('httpUploadProgress', cbProgress);
    upload.on('error', function(error){console.log('aws-s3.service error', error);})
    return upload.promise();
  }

  /*
  This should fail, now, because vpatlas user only has Object level permissions
  on bucket vpatlas.data. To add bucket-level action permissions, go to that
  *bucket* in AWS and alter the 'Bucket Policy'. So far, have only figured out
  how to add like this:

  {
    "Sid": "AddPermAtlasUser",
    "Effect": "Allow",
    "Principal": {
        "AWS": "arn:aws:iam::824614856275:user/vpatlas"
    },
    "Action": "s3:*",
    "Resource": "arn:aws:s3:::vpatlas.data/*"
}
  */
  public createBucket(subBucket=null) {
    if (!subBucket) return null;

    var bucketName = `vpatlas.data.${subBucket}`;

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
