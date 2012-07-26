// Google Picker for uploading images
function newImagePicker() {
    google.load('picker', '1', {"callback" : createImagePicker});
}       

// Create and render a Picker object for selecting documents
function createImagePicker() {
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
        setCallback(ImagePickerCallback).
        build();
    picker.setVisible(true);
}

// A simple callback implementation for Picker.
function ImagePickerCallback(data) {
    if(data.action == google.picker.Action.PICKED){
        var doc = data[google.picker.Response.DOCUMENTS][0];
        site_url = doc[google.picker.Document.URL]; // only shows website url :(
        image_url = data.docs[0].thumbnails[data.docs[0].thumbnails.length - 1].url;
        alert('Picked image url: ' + image_url);
    }
}

// Google Picker for uploading videos
function newVideoPicker() {
    google.load('picker', '1', {"callback" : createVideoPicker});
}

function createVideoPicker() {
    var picker = new google.picker.PickerBuilder().
        addView(new google.picker.VideoSearchView().
            setSite(google.picker.VideoSearchView.YOUTUBE)).
        addView(google.picker.ViewId.YOUTUBE).
        addView(new google.picker.WebCamView()).
        setCallback(VideoPickerCallback).
        build();
    picker.setVisible(true);
}

// A simple callback implementation for Picker.
function VideoPickerCallback(data) {
    if(data.action == google.picker.Action.PICKED){
        var doc = data[google.picker.Response.DOCUMENTS][0];
        site_url = doc[google.picker.Document.URL]; // only shows website url :(
        // image_url = data.docs[0].thumbnails[data.docs[0].thumbnails.length - 1].url;
        embed_url = doc[google.picker.Document.EMBEDDABLE_URL];
        alert(embed_url);
    }
}
