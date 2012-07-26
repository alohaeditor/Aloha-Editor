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

        var img = Aloha.jQuery("<img />").attr("src", image_url);
        AlohaInsertIntoDom(img);
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
        // image_url = data.docs[0].thumbnails[data.docs[0].thumbnails.length - 1].url; // we only get a image preview with this
        embed_url = doc[google.picker.Document.EMBEDDABLE_URL];
        var embed_code_template = Aloha.jQuery('<object width="420" height="236"><param name="movie" value="http://www.youtube.com/v/Rj8JoAAytyg?version=3&amp;hl=de_DE"></param><param name="allowFullScreen" value="true"></param><param name="allowscriptaccess" value="always"></param><embed src="" type="application/x-shockwave-flash" width="560" height="315" allowscriptaccess="always" allowfullscreen="true"></embed></object>');
        var embed_code = Aloha.jQuery(embed_code_template).find('embed').attr('src', embed_url);
        AlohaInsertIntoDom(embed_code);
    }
}
