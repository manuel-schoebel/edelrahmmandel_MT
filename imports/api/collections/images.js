import { FilesCollection } from 'meteor/ostrio:files';
import { Opinions } from '../collections/opinions';
//import { OpinionDetails } from '../collections/opinionDetails';

let ImageConfig = {
    collectionName: 'images',
    downloadRoute: '/files',
    allowClientCode: false, // Disallow remove files from Client
    onBeforeUpload(file) {
        // Allow upload files under 10MB, and only in png/jpg/jpeg formats
        if (file.size <= 10485760 && /png|jpg|jpeg/i.test(file.extension)) {
            return true;
        }
        return 'Please upload image, with size equal or less than 10MB';
    },
    async protected(fileObj) {
        // protect access to the file
        // only autth users that has shared the opinion can
        // access the image-file
        if (!this.userId) return false;

        const { refOpinion } = fileObj.meta;

        // ... and check then if the current-user is member of sharedWith
        const opinion = await Opinions.findOneAsync({
            _id: refOpinion,
            'sharedWith.user.userId': this.userId
        });

        if (!opinion) return false;

        return true;
    }
};

if (Meteor.isServer){
    const settings = JSON.parse(process.env.MGP_SETTINGS);
    ImageConfig.storagePath = settings.ImagePath;
}

export const Images = new FilesCollection(ImageConfig);