import { Meteor } from 'meteor/meteor';
import { useSearchParams } from 'react-router';

import React, { Fragment } from 'react';

import Modal from 'antd/lib/modal';
import message from 'antd/lib/message';
import Space from 'antd/lib/space';
import Button from 'antd/lib/button';
import Divider from 'antd/lib/divider';
import Tooltip from 'antd/lib/tooltip';

import CloseOutlined from '@ant-design/icons/CloseOutlined';
import ExclamationCircleOutlined from '@ant-design/icons/ExclamationCircleOutlined';
import DeleteOutlined from '@ant-design/icons/DeleteOutlined';
import LikeOutlined from '@ant-design/icons/LikeOutlined';
import LikeTwoTone from '@ant-design/icons/LikeTwoTone';
import DislikeOutlined from '@ant-design/icons/DislikeOutlined'; 
import DislikeTwoTone from '@ant-design/icons/DislikeTwoTone';
import EyeInvisibleOutlined from '@ant-design/icons/EyeInvisibleOutlined';
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import CheckOutlined from '@ant-design/icons/CheckOutlined';
import CloseSquareOutlined from '@ant-design/icons/CloseSquareOutlined';
import FileDoneOutlined from '@ant-design/icons/FileDoneOutlined';
import FileUnknownOutlined from '@ant-design/icons/FileUnknownOutlined';

import { Summernote } from './Summernote';
import { ActionCodeDropdown } from '../components/ActionCodeDropdown';
import { actionCodes } from '../../api/constData/actioncodes';

import { ModalKIAgent } from '../modals/KIAgent';

import { AppState, getAppState, setAppState } from '../../client/AppState';

const summernoteOptions = { 
    airMode: false, 
    popover: {
        image: [
            ['image', ['resizeFull', 'resizeHalf', 'resizeQuarter', 'resizeNone']],
            ['float', ['floatLeft', 'floatRight', 'floatNone']],
            ['remove', ['removeMedia']]
        ],
        link: [
            ['link', ['linkDialogShow', 'unlink']]
        ],
        table: [
            ['add', ['addRowDown', 'addRowUp', 'addColLeft', 'addColRight']],
            ['delete', ['deleteRow', 'deleteCol', 'deleteTable']],
        ],
        air: [
            ['font', ['bold', 'underline', 'italic', 'superscript']],
            ['font1', ['clear']],
            ['color', ['forecolor', 'backcolor']],
            ['para', ['ul', 'ol']],
            ['para1', ['paragraph']],
            ['table', ['table']],
            ['link', ['linkDialogShow', 'unlink']],
            ['view', ['fullscreen', 'codeview']]
        ]
    },
    toolbar: [
        ['font', ['bold', 'underline', 'italic', 'superscript']],
        ['font1', ['clear']],
        ['color', ['forecolor', 'backcolor']],
        ['para', ['ul', 'ol']],
        ['para1', ['paragraph']],
        ['table', ['table']],
        ['link', ['linkDialogShow', 'unlink']],
        ['view', ['fullscreen', 'codeview']]
    ]
};

const IconText = ({ icon, text }) => (
    <Space>
        {React.createElement(icon)}
        {text}
    </Space>
);

const MbacTooltip = props => {
    const { title, className, show, children } = props;

    if (show) return (
        <Tooltip className={className} title={title} >
            { children }
        </Tooltip>
    )
    
    return (
        <Fragment>
            { children }
        </Fragment>
    )
}

const FloatingActions = ({mode, onSave, onCancel, onSocialClick, onCheckAnswer, onRemove, onFinallyRemove, isSpellchecked, isDeleted, isAnswer, likes, dislikes, value, refOpinion, canEdit = false, canFinallyRemove = false }) => {
    onSave = onSave || function(){};
    onCancel = onCancel || function(){};
    onCheckAnswer = onCheckAnswer || function(){};
    onSocialClick = onSocialClick || function(){};
    onRemove = onRemove || function(){};
    onFinallyRemove = onFinallyRemove || function(){};

    const doneBefore = arr => {
        const uid = Meteor.userId();
        
        return arr.filter( ({userId}) => userId == uid ).length > 0;
    }

    const listSocial = list => {
        return (
            <div className="mbac-tooltip-social-list">
                <ul className="ant-list">
                    {
                        list.map( ({userId, firstName, lastName}) => <li className="ant-list-item" key={userId}>{firstName + (firstName ? ' ':'') + lastName}</li>)
                    }
                </ul>
            </div> 
        );
    }

    return (
        <div className="mbac-floating-actions">
            <CloseSquareOutlined className="mbac-cancel-icon" onClick={onCancel} />

            <div className="mbac-additional-actions">
                <Space split={<Divider type="vertical" />}>
                    <MbacTooltip className="mbac-simple-social-list" title={listSocial(likes)} show={likes.length !== 0}>
                        <Space>
                            { doneBefore(likes)
                                ?<LikeTwoTone onClick={ e => onSocialClick('like') } />
                                :<LikeOutlined onClick={ e => onSocialClick('like') } />
                            }
                            <span>{likes.length}</span>
                        </Space>
                    </MbacTooltip>
                    <MbacTooltip className="mbac-simple-social-list" title={listSocial(dislikes)} show={dislikes.length !== 0} >
                        <Space>
                            { doneBefore(dislikes)
                                ?<DislikeTwoTone onClick={ e => onSocialClick('dislike') } />
                                :<DislikeOutlined onClick={ e => onSocialClick('dislike') } />
                            }
                            <span>{dislikes.length}</span>
                        </Space>
                    </MbacTooltip>

                    { isSpellchecked 
                        ? <Tooltip title="Rechtschreibmarkierung setzen"><FileUnknownOutlined onClick={ e => onSocialClick('spellchecked') } /> </Tooltip>
                        : <Tooltip title="Rechtschreibmarkierung zurücknehmen"><FileDoneOutlined style={{fontSize:28, color:'#47b147'}} onClick={ e => onSocialClick('spellchecked') } /> </Tooltip>
                    }

                    { canEdit && isAnswer ? <Tooltip title="Als Antwort auswählen. Zur Frage sollte eine kurze Zusammenfassung der Handlungsempfehlung geschrieben werden."><CheckOutlined onClick={onCheckAnswer} /></Tooltip>  : null }
                    { canEdit ? (isDeleted ? <Tooltip title="Sichtbar schalten"><EyeInvisibleOutlined onClick={onRemove} /></Tooltip> : <Tooltip title="Unsichtbar schalten"><EyeOutlined onClick={onRemove} /></Tooltip>) : null }
                    
                    { canFinallyRemove ? <Tooltip title="LÖSCHEN"><DeleteOutlined onClick={onFinallyRemove} /></Tooltip> : null }
                    
                    
                    { //KI mit anzeigen, wenn Bearbeitungsrechte bestehen - aktuell noch deaktiviert!
                        (canEdit && false) ? <ModalKIAgent initText = { value } refOpinion = { refOpinion }/> : null
                    }
                        
                </Space>
            </div>
            { mode !== 'FOCUSED' ?
                <div className="mbac-primary-actions">
                    { canEdit & mode == 'EDIT'
                        ?   <Space>
                                <Button type="dashed" icon={<CloseOutlined />} /*size="large"*/ onClick={onCancel}>Abbruch</Button>
                                <Button type="primary" icon={<CheckOutlined />} /*size="large"*/ onClick={onSave}>Speichern</Button>
                            </Space>
                        : <Button type="primary" onClick={onCancel}>OK</Button>
                    }
                </div>
                : null
            }
        </div>
    )
}

function withSearchParams(Component) {
    return function WrapperComponent(props) {
    const [searchParams, setSearchParams] = useSearchParams();

      return <Component {...props} searchParams={searchParams} setSearchParams={setSearchParams} />;
    };
  }

export class _EditableContent extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            mode: 'SHOW'
        }

        const {item} = this.props;
        const {canEdit, canDelete} = this.props.permissions;

        this.inputRef = React.createRef();
        this.componentValueSetup = true; // will be used in componentDidUpdate to assign the value for the firsttime
    }

    checkAndFocusContentByQueryString() {
        const activitiesBy = this.props.searchParams.get('activitiesBy');
        const { refDetail } = this.props;
        const { mode } = this.state;

        if (activitiesBy === refDetail) {
            if (mode !== 'EDIT' && mode !== 'FOCUSED') {    
                this.toggleMode();
            }
        }
    }

    componentDidMount() {
        this.checkAndFocusContentByQueryString();

        const { type, value } = this.props;
        const { mode } = this.state;

        document.addEventListener('keydown', this.onKeyDown.bind(this));
    }

    componentWillUnmount(){
        document.removeEventListener('keydown', this.onKeyDown);
    }

    componentDidUpdate(prevProps, prevState) {
        const { type, value } = this.props;
        const { mode } = this.state;
        this.checkAndFocusContentByQueryString();

        if (mode == 'EDIT') {
            if (prevProps.value === value && !this.componentValueSetup) return;
            this.componentValueSetup = false;

            if (type == 'wysiwyg') {
                this.inputRef.current.editor.summernote('code', value);
            } else if (type == 'span') {
                this.inputRef.current.innerText = value;
                this.inputRef.current.focus({cursor: 'all', preventScroll: true});
            } else if (type == 'actioncode') {
                // noop the ActionCodeDropdown will handle this via value prop
            }
        }
    }

    exitEditmode(newMode = 'SHOW') {
        const { refDetail } = this.props;

        if (newMode == 'SHOW') {
            setAppState({ selectedDetail: null });

            this.props.setSearchParams((prev) => {
                console.log('setSearchParams')
                prev.set("activitiesBy", null);
                return prev;
              });
        }

        this.setState({ mode: newMode });
        // reset to true to assign actual value at new EDIT mode
        this.componentValueSetup = true;
    }

    toggleDeleted() {
        const { refDetail } = this.props;

        setAppState({appIsBusy: 'Working...'});
        this.setState({saving:true});
        
        Meteor.call('opinionDetail.toggleDeleted', refDetail, (err, res) => {
            setAppState({appIsBusy: false});
            this.setState({saving:false})

            if (err) {
                return Modal.error({
                    title: 'Fehler',
                    content: 'Es ist ein interner Fehler aufgetreten. ' + err.message
                });
            } else {
                this.exitEditmode();

                this.recreatePdfPreview();
            }
        });
    }

    toggleSpellcheck() {
        const { refDetail } = this.props;

        setAppState({appIsBusy: 'Working...'});
        this.setState({saving:true});
        
        Meteor.call('opinionDetail.toggleSpellcheck', refDetail, err => {
            setAppState({appIsBusy: false});
            this.setState({saving:false})

            if (err) {
                return Modal.error({
                    title: 'Fehler',
                    content: 'Es ist ein interner Fehler aufgetreten. ' + err.message
                });
            }
        });
    }


    finallyRemove() {
        const { refDetail } = this.props;
        Modal.confirm({
            title: 'Löschen',
            icon: <ExclamationCircleOutlined />,
            content: 'Soll der Eintrag wirklich gelöscht werden?',
            okText: 'OK',
            cancelText: 'Abbruch',
            onOk: closeConfirm => {
                closeConfirm();

                setAppState({appIsBusy: 'Löschen'});
                this.setState({saving:true});

                Meteor.call('opinionDetail.finallyRemove', refDetail, (err, res) => {
                    setAppState({appIsBusy: false});
                    this.setState({saving:false})

                    if (err) {
                        return Modal.error({
                            title: 'Fehler',
                            content: 'Es ist ein interner Fehler aufgetreten. ' + err.message
                        });
                    } else {
                        this.exitEditmode();

                        this.recreatePdfPreview();
                    }
                });
            }
        });
    }

    checkAnswer() {
        const { mode } = this.state;
            if ( mode == 'EDIT' ) this.saveData();
        const { refDetail } = this.props;

        setAppState({appIsBusy: 'Working...'});
        this.setState({saving:true})
        Meteor.call('opinionDetail.checkAnswer', refDetail, (err, res) => {
            setAppState({appIsBusy: false});
            this.setState({saving:false})
            if (err) {
                return Modal.error({
                    title: 'Fehler',
                    content: 'Es ist ein interner Fehler aufgetreten. ' + err.message
                });
            }
            this.exitEditmode();
        });
    }

    doSocial(action) {
        if (action == 'spellchecked') return this.toggleSpellcheck();

        const { refDetail } = this.props;

        setAppState({appIsBusy: 'Speichern'});
        this.setState({saving:true});

        Meteor.call('opinionDetail.doSocial', action, refDetail, (err, res) => {
            setAppState({appIsBusy: false});
            this.setState({saving:false});

            if (err) {
                return Modal.error({
                    title: 'Fehler',
                    content: 'Es ist ein interner Fehler aufgetreten. ' + err.message
                });
            }
        });
    }

    saveData() {
        const { type, refDetail, field, method = 'opinionDetail.update' } = this.props;
        const inp = this.inputRef.current;
        let newValue;
        
        if (type == 'wysiwyg') {
            newValue = inp.editor.summernote('code');
        } else if (type == 'span') {
            newValue = inp.innerText;
        } else if (type == 'actioncode') {
            newValue = inp.state.value;
        }
        
        // check for changes
        if (!this.isDirty()) return this.exitEditmode();

        if (!newValue) {
            inp.focus({cursor: 'all', preventScroll: true});
            return message.error('Die Eingabe darf nicht leer sein.');
        }
        setAppState({appIsBusy: 'Speichern'});
        this.setState({saving:true})
        
        Meteor.call(method, { id: refDetail, data: { [field]: newValue }}, err => {
            setAppState({appIsBusy: false});
            this.setState({saving:false});
            if ( err && !err.message.includes( '[500]' ) ) {
                // Alle Fehler außer 'Internal server error [500]' ausgeben. Dieser [500] Fehler kommt regelmäßig im Produktivsystem.
                return Modal.error({
                    title: 'Fehler',
                    content: 'Es ist ein interner Fehler aufgetreten. ' + err.message
                });
            } else {
                this.recreatePdfPreview();

                this.setState({ mode: 'FOCUSED' });

                setAppState({
                    selectedDetail: {
                        _id: refDetail,
                        mode: 'FOCUSED',
                        discardChanges: this.discardChanges.bind(this),
                        saveData: this.saveData.bind(this),
                        isDirty: this.isDirty.bind(this)
                    }
                });
                
                // reset to true to assign actual value at new EDIT mode
                this.componentValueSetup = true;
            }
        });
    }

    isDirty() {
        const { type, value, field, refDetail } = this.props;
        const { mode } = this.state;

        if (mode != 'EDIT') return false;

        let newValue;
        const inp = this.inputRef.current;
        if (type == 'wysiwyg') {
            newValue = inp.editor.summernote('code');
        } else if (type == 'span') {
            newValue = inp.innerText;
        } else {
            newValue = inp.state.value;
        }

        // check for changes
        return (newValue !== value);
    }

    toggleMode() {
        const { refDetail, field, permissions, elementType } = this.props;
        const { mode } = this.state;
        const { canEdit } = permissions;

        if (AppState.selectedDetail && AppState.selectedDetail.mode == 'EDIT') {
            if (AppState.selectedDetail.isDirty()) {
                return message.error('Bitte schließen Sie die aktuelle Bearbeitung ab, bevor Sie mit der Bearbeitung einer neuen Stelle beginnen.');
            }
            AppState.selectedDetail.discardChanges();
        } else if (AppState.selectedDetail && AppState.selectedDetail.mode == 'FOCUSED') {
            AppState.selectedDetail.discardChanges();
        }

        let newMode = 'SHOW';
        if (mode == 'SHOW') {
            newMode = 'FOCUSED';
        } else if (mode == 'FOCUSED') {
            newMode = elementType === "Pagebreak" ? 'FOCUSED' : (canEdit ? 'EDIT':'FOCUSED');
        }

        this.props.setSearchParams((prev) => {
            console.log('setSearchParams')
            prev.set("activitiesBy", refDetail);
            return prev;
          });
          

        setAppState({
            selectedDetail: {
                _id: refDetail,
                mode: newMode,
                discardChanges: this.discardChanges.bind(this),
                saveData: this.saveData.bind(this),
                isDirty: this.isDirty.bind(this)
            }
        });

        this.setState({ mode: newMode });
    }

    discardChanges() {
        this.exitEditmode();
    }

    cancelEditmode() {
        const { mode } = this.state;
        
        if ( mode == 'EDIT' )
            this.exitEditmode('FOCUSED');
        else if ( mode == 'FOCUSED' )
            this.exitEditmode('SHOW');
    }

    uploadImage(images, insertImage) {
        
        /* FileList does not support ordinary array methods */
        for (let i = 0; i < images.length; i++) {
            /* Stores as bas64enc string in the text.
             * Should potentially be stored separately and include just the url
             */
            const reader = new FileReader();

            reader.onloadend = () => {
                insertImage(reader.result);
            };

            reader.readAsDataURL(images[i]);
        }
    }

    PasteFromClipboard(e) {
        const bufferText = ((e.originalEvent || e).clipboardData || window.clipboardData).getData('Text');
        
        e.preventDefault();
        document.execCommand('insertText', false, bufferText);
    }

    onKeyDown(e) {
        if (this.state.saving) {
            e.preventDefault();
            return;
        }

        const {ctrlKey, key, keyCode} = e;

        if (ctrlKey && key == 's') {
            e.preventDefault();

            const { mode } = this.state;
            if ( mode == 'EDIT' ) this.saveData();
        }
        
        if (keyCode == 27) {
            e.preventDefault();
            this.cancelEditmode();
        }
    }

    recreatePdfPreview() {
        if (getAppState('livePdfPreview')) {
            const refOpinion = this.props.searchParams.get('id');

            setAppState({previewUrlBusy:true})
            Meteor.call('opinion.createPDF', refOpinion, 'livepreview', (err, url) => {
                setAppState({previewUrlBusy:false})
                
                if (!err) setAppState({previewUrl:url});
            });
        }
    }

    render() {
        const { item, type, value, refDetail, permissions, elementType } = this.props;
        const { mode } = this.state;
        const { canEdit, canDelete } = permissions;

        console.log({refDetail, mode})

        const toggleMode = this.toggleMode.bind(this);
        const uploadImage = this.uploadImage.bind(this);
        const PasteFromClipboard = this.PasteFromClipboard.bind(this);
        const onKeyDown = this.onKeyDown.bind(this);

        const PreparedFloatingActions = <FloatingActions
            mode={mode}
            onSave={this.saveData.bind(this)} 
            onCancel={this.cancelEditmode.bind(this)}
            onCheckAnswer={this.checkAnswer.bind(this)}
            onRemove={this.toggleDeleted.bind(this)}
            onFinallyRemove={this.finallyRemove.bind(this)}
            onSocialClick={this.doSocial.bind(this)}      
            isSpellchecked={!!!item.spellchecked}
            isDeleted={item.deleted}
            isAnswer={item.type == 'ANSWER'}
            likes={item.likes}
            dislikes={item.dislikes}
            //canEdit={elementType !== "Pagebreak" && canEdit}
            value={value}
            refOpinion={item.refOpinion}
            canEdit={canEdit}
            canFinallyRemove={canDelete}
        />;

        if (type == 'span') {
            if (mode == 'EDIT') {
                return (
                    <Fragment>
                        <Space>
                            <span ref={this.inputRef} className="mbac-editable-content" contentEditable="true" onKeyDown={onKeyDown}></span>
                            { PreparedFloatingActions }
                        </Space>
                    </Fragment>
                )
            }

            return (
                <Fragment>
                    { !!item.spellchecked 
                        ? <FileDoneOutlined style={{position:'relative', float:'left', left:0, top:6, marginLeft:-16, fontSize:12, color:'#47b147'}} /> 
                        : null
                    }
                    <span className={`mbac-could-styled-as-deleted ${mode=='FOCUSED'?'mbac-detail-focused':''}`} onClick={toggleMode}>{value}</span>
                    { mode === 'FOCUSED' ? PreparedFloatingActions : null }
                </Fragment>
            )
        } else if (type == 'wysiwyg') {
            if (mode == 'EDIT') {
                return (
                    <Fragment>
                        <Summernote
                            ref={this.inputRef}
                            className="mbac-editable-content mbac-wysiwyg"
                            onImageUpload={uploadImage}
                            onPaste={PasteFromClipboard}
                            onKeyDown={onKeyDown}
                            options={summernoteOptions}
                        />
                        { PreparedFloatingActions }
                    </Fragment>
                )
            }

            return (
                <Fragment>
                    <div>
                        
                        { !!item.spellchecked 
                            ? <FileDoneOutlined style={{position:'relative', float:'left', left:0, top:6, marginLeft:-16, fontSize:12, color:'#47b147'}} /> 
                            : null
                        }
                        <div className={`mbac-could-styled-as-deleted ${mode=='FOCUSED'?'mbac-detail-focused':''}`}
                            onClick={toggleMode}
                            dangerouslySetInnerHTML={ {__html: value } }
                        />
                    </div>
                    { mode === 'FOCUSED' ? PreparedFloatingActions : null }
                </Fragment>
            )

        } else if (type == 'actioncode') {
            if (mode == 'EDIT') {
                return (
                    <Fragment>
                        <ActionCodeDropdown 
                            className="mbac-editable-content"
                            ref={this.inputRef}
                            refDetail={refDetail}
                            autoUpdate={false}
                            value={value}
                        />
                        { PreparedFloatingActions }
                    </Fragment>
                )
            }

            const actionCodeLongtext = actionCodes[value].longtext;
            return (
                <Fragment>
                    <div className={`mbac-could-styled-as-deleted ${mode=='FOCUSED'?'mbac-detail-focused':''}`}
                        onClick={toggleMode}
                    >
                        {actionCodeLongtext}
                    </div>
                    { mode === 'FOCUSED' ? PreparedFloatingActions : null }
                </Fragment>
            );
        }

        return <div>UNKNOWN type: {type}</div>;
    }
}


export const EditableContent = withSearchParams(_EditableContent);