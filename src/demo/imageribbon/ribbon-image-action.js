// Google Picker API for uploading picture
function newPicker() {
    google.load('picker', '1', {"callback" : createPicker});
}       

// Create and render a Picker object for selecting documents
function createPicker() {
    var picker = new google.picker.PickerBuilder().
        addView(new google.picker.ImageSearchView().
                setLicense(google.picker.ImageSearchView.License.REUSE)
            ).
        addView(google.picker.ViewId.PHOTO_UPLOAD).
        /*
        addViewGroup(
        new google.picker.ViewGroup(google.picker.ViewId.PHOTOS).
            addView(new google.picker.PhotosView().
                setType(google.picker.PhotosView.Type.UPLOADED)).
            addView(new google.picker.PhotosView().
                setType(google.picker.PhotosView.Type.FEATURED))).
        */        
        addView(google.picker.ViewId.PHOTOS).
        addView(new google.picker.WebCamView(google.picker.WebCamViewType.STANDARD)).
        setCallback(pickerCallback).
        build();
    picker.setVisible(true);
}

// A simple callback implementation for Picker.
function pickerCallback(data) {
    if(data.action == google.picker.Action.PICKED){
        var doc = data[google.picker.Response.DOCUMENTS][0];
        site_url = doc[google.picker.Document.EMBEDDABLE_URL]; // only shows website url :(
        image_url = data.docs[0].thumbnails[data.docs[0].thumbnails.length - 1].url;
        alert('Picked image url: ' + image_url);
    }
}
