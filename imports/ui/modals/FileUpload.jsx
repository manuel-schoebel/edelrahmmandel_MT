import { Meteor } from 'meteor/meteor';
import React, { Fragment, useState } from 'react';
import Button from 'antd/lib/button';
import Modal from 'antd/lib/modal';
import Space from 'antd/lib/space';
import Upload from 'antd/lib/upload';
import message from 'antd/lib/message';

import PictureOutlined from '@ant-design/icons/PictureOutlined';
import InboxOutlined from '@ant-design/icons/InboxOutlined';

import { Images } from '/imports/api/collections/images';
import { useImages, useOpinion } from '../../client/trackers';

import { ModalBackground } from '../components/ModalBackground';

import Compressor from 'compressorjs';

export const ModalFileUpload = ( { mode/*NEW||EDIT*/, refOpinion, refDetail }) => {
    const [ images, imagesLoading ] = useImages();
    const [ showModal, setShowModal ] = useState(false);

    const [ opinion, opinionLoading ] = useOpinion(refOpinion);

    const closeModal = e => {
        //form.resetFields();
        setShowModal(false);
    }

    const showModalVisible = (e) => {
        // prevent collapse-trigger to react/launch
        e.stopPropagation();        

        setShowModal(true);
    }
    
    const ActionButton = () => {
        if (mode === "EDIT") {
            return (
                <Button type="dashed" onClick={ showModalVisible }>
                    <Space>
                        <PictureOutlined />
                        Bilder
                    </Space>
                </Button>
            );
        }
    }

    const doUpload = (file) => {
        //new Compressor(file)

        const uploadImage = file => {

            const upload = Images.insert({
                file,
                chunkSize: 'dynamic',
                meta: { refOpinion }
            }, false);
        
            upload.on('start', function () {
                //console.log('upload start', this)
            });

            upload.on('end', function (error, fileObj) {                
                if (error) {
                    message.error(`Fehler beim Upload: ${error}`);
                } else {
                    const data = {
                        refOpinion,
                        refParentDetail: refDetail, // the new parent is the current detail
                        type: 'PICTURE',
                        title: fileObj.name,
                        printTitle: fileObj.name,
                        text: 'Bildtext',
                        // _id is not yet available in fileObj but we need it
                        // see: https://github.com/veliovgroup/Meteor-Files/issues/889
                        files: [{...fileObj, _id: this.config.fileId}]
                    }

                    Meteor.call('opinionDetail.insert', data, (err, res) => {
                        if (err) {
                            message.error(`${err.message} file upload failed.`);
                        }
                    });
                }
            });

            upload.start();
        }

        new Compressor(file, {
            maxWidth: 600,
            quality: 0.75,
            drew(context, canvas) {
                if (opinion && opinion.disableCopyright) return;
                
                context.fillStyle = '#fff';
                context.font = '11pt Arial';
                if ( opinion.outputTemplate.indexOf( 'mebedo' ) > -1 )
                    context.fillText('© MEBEDO Consulting GmbH', 20, canvas.height - 20);
                else
                    context.fillText('© Ensmann Consulting GmbH', 20, canvas.height - 20);
            },
            success(compressedImage) {
                uploadImage(compressedImage);
            },
            error(err) {
                console.log('compressor-err:', err);
            },
        });
    }

    const props = {
        name: 'file',
        multiple: true,
        customRequest:({ onSuccess }) => setTimeout(() => { onSuccess( 'ok' , null ); } , 0 ),//Wichtig, damit keine POST 405 Fehlermeldung kommt vom Webserver
        action: doUpload,
        onChange(info) {
            const { status } = info.file;
            if (status !== 'uploading') {
                //console.log(info.file, info.fileList);
            }
            if (status === 'done') {
                //message.success(`${info.file.name} file uploaded successfully.`);
            } else if (status === 'error') {
                //message.error(`${info.file.name} file upload failed.`);
                console.log('Error Upload', info);
            }
        },
    };

    return (
        <Fragment>
            <ActionButton />

            { !showModal ? null :
                <ModalBackground>
                    <Modal
                        className="mbac-modal-upload-pictures"
                        title="Bilder hinzufügen"
                        //width="80%"
                        open={ showModal }
                        onOk={ closeModal }
                        onCancel={ closeModal }
                        cancelButtonProps={{className:"mbac-btn-cancel"}}
                        okText="Schließen"
                        maskClosable={false}
                        //onClick={ preventClickPropagation }
                    >
                        <Upload.Dragger {...props}>
                            <p className="ant-upload-drag-icon">
                                <InboxOutlined />
                            </p>
                            <p className="ant-upload-text">
                                Bitte hier klicken oder per "Drag And Drop" entsprechende Dateien hier ablegen.
                            </p>
                            
                            <p className="ant-upload-hint">
                                Die angefügten Bilder werden jeweils als neuer Detailpunkt abgelegt.
                            </p>
                            
                        </Upload.Dragger>
                    </Modal>
                </ModalBackground>
            }
        </Fragment>
    );
}