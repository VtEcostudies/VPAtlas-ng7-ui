import { FormGroup } from '@angular/forms';

// custom validator to check that email OR phone is filled
export function EmailOrPhone(phoneControlName: string, emailControlName: string) {
    return (formGroup: FormGroup) => {
        const emailControl = formGroup.controls[emailControlName];
        const phoneControl = formGroup.controls[phoneControlName];
/*
        console.log('email-or-phone.validator | email: ', emailControl.value, 'phone: ', phoneControl.value);

        if (emailControl.errors && !emailControl.errors.emailOrPhone) {
            // return if another validator has already found an error on the matchingControl
            return;
        }
*/
        //console.log('email-or-phone.validator | email: ', emailControl.value, 'phone: ', phoneControl.value);

        // set error on both controls if validation fails
        if (!emailControl.value && !phoneControl.value) {
            emailControl.setErrors({ emailOrPhone: true });
            phoneControl.setErrors({ emailOrPhone: true });
            //console.log('email-or-phone.validator | email Error: ', emailControl.errors.emailOrPhone, 'phone Error: ', phoneControl.errors.emailOrPhone);
        } else {
            emailControl.setErrors(null);
            phoneControl.setErrors(null);
            //console.log('email-or-phone.validator | email Error: ', emailControl.errors, 'phone Error: ', phoneControl.errors);
        }
    }
}
