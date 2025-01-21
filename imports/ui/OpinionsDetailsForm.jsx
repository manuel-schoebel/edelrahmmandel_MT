import React, { Fragment, useState, useEffect } from 'react';
import { FlowRouter } from 'meteor/kadira:flow-router';

import PageHeader from 'antd/lib/page-header';
import Layout from 'antd/lib/layout';
import Affix from 'antd/lib/affix';
import Space from 'antd/lib/space';
import Skeleton from 'antd/lib/skeleton';
import Spin from 'antd/lib/spin';
import Button from 'antd/lib/button';
import Switch from 'antd/lib/switch';
//import Icon from 'antd/lib/icon';
import Tooltip from 'antd/lib/tooltip';
import { useParams } from "react-router";

const { Content } = Layout;

//import ShareAltOutlined from '@ant-design/icons/ShareAltOutlined';
import FilePdfOutlined from '@ant-design/icons/FilePdfOutlined';
import CloseOutlined from '@ant-design/icons/CloseOutlined';
import ExportOutlined from '@ant-design/icons/ExportOutlined';
import InfoCircleOutlined from '@ant-design/icons/InfoCircleOutlined';

import { layouttypesObject } from '../api/constData/layouttypes';

import { ModalFileUpload } from './modals/FileUpload';
import { ModalOpinion } from './modals/Opinion';
import { ActionTodoList } from './components/ActionTodoList';
import { OpinionBreadcrumb } from './components/OpinionBreadcrumb';
import { OpinionContent } from './OpinionContent';

import { ModalSortPictures } from './modals/SortPictures';

import { ListOpinionDetails } from './ListOpinionDetails/ListOpinionDetails';
import { hasPermission } from '../api/helpers/roles';

import { useAccount } from '../client/trackers';

import { 
    useOpinion,
    useOpinionDetail
} from '../client/trackers';

import { ModalShareWith } from './modals/share-with';
import { useAppState } from '../client/AppState';



export const OpinionsDetailsForm = ({refDetail, currentUser}) => {
    const { opinionId } = useParams();
    const { hasAdminRole , hasRoleOPINION_CONTROL } = useAccount();
    const [opinion, opinionIsLoading] = useOpinion(opinionId , hasRoleOPINION_CONTROL );
    const [detail, detailIsLoading] = useOpinionDetail(opinionId, refDetail);

    const [ canEdit, setCanEdit ] = useState(false);
    const [ canDelete, setCanDelete ] = useState(false);
    const [ canShare, setCanShare ] = useState(false);
    const [ canCancelShare, setCanCancelShare ] = useState(false);
    const [ canShareWithExplicitRole, setCanShareWithExplicitRole ] = useState(false);

    const [ pendingPdfCreation, setPendingPdfCreation] = useState(false);
    const [ pendingCSVExport, setPendingCSVExport] = useState(false);
    const [ activeTabPane, setActiveTabPane ] = useState("DOCUMENT");

    const [ visiblePdfPreview, setVisblePdfPreview ] = useState(false);
    const [ pdfPreviewData, setPdfPreviewData ] = useState(null);

    const [ livePdfPreview, setLivePdfPreview ] = useAppState('livePdfPreview');
    const [ previewUrl, setPreviewUrl ] = useAppState('previewUrl');
    const [ previewUrlBusy, setPreviewUrlBusy ] = useAppState('previewUrlBusy');

    const [ selectedDetail ] = useAppState('selectedDetail');

    const tabPaneChanged = activeTabPane => {
        setActiveTabPane(activeTabPane);
    }
    
    if (FlowRouter.getQueryParam('pdfPreview') !== 'on' && visiblePdfPreview) {
        setVisblePdfPreview(false);
    } else if (FlowRouter.getQueryParam('pdfPreview') == 'on' && !visiblePdfPreview && pdfPreviewData) {
        setVisblePdfPreview(true);
    }

    const createToDoCSVExport = () => {
        return () => {
            setPendingCSVExport( true );
            Meteor.call( 'opinion.ToDoCSVExport' , opinionId , ( err , res ) => {
                if ( err )
                    console.log( err );

                if ( res != '' ) {
                    let elemx = document.createElement('a');
                    elemx.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent( res );
                    elemx.download = 'OPL_' + String( opinionId ) + '.csv';
                    elemx.style.display = 'none';
                    document.body.appendChild( elemx );
                    elemx.click();
                    document.body.removeChild( elemx );
                    // setPendingCSVExport( false );
                }
            });
            setPendingCSVExport( false );
        }
    }

    const createPDF = ( previewOnly , iProtected = false ) => {
        return () => {
            setPendingPdfCreation(true);

            Meteor.call('opinion.createPDF', opinionId, previewOnly, iProtected, (err, res) => {
                console.log(res);
                if (err) console.log(err);
        
                if (previewOnly) {
                    //return window.open(res);

                    /*let content = `data:application/pdf;base64, ${res}`;
                    let pdfSrc = content;
            
                    let html = `<object data="${pdfSrc}" type="application/pdf" width="100%" height="100%">
                                    <iframe width="100%" height="100%" src="${pdfSrc}">
                                    </iframe>
                                </object>`;
                    
                    let html = `<embed
                    type="application/pdf"
                    src="${pdfSrc}"
                    frameBorder="0"
                    width="100%"
                    height="100%"
                    />`;

                    let newPdfWindow = window.open("new window");
                    newPdfWindow.document.write(html);*/

                    //this.loadingCF.next(false);


                    setPdfPreviewData(res);
                    FlowRouter.setQueryParams({ pdfPreview: 'on' });
                    setVisblePdfPreview(true);
                }
                setPendingPdfCreation(false);
            });
        }
    }

    const createLivePdfPreview = () => {
        setPreviewUrlBusy(true);
        Meteor.call('opinion.createPDF', opinionId, 'livepreview', (err, url) => {
            setPreviewUrlBusy(false);
            if (!err) setPreviewUrl(url);
        });
    }

    const toggleLivePdfPreview = () => (checked) => {
        setLivePdfPreview(checked);
        if (checked) {
            createLivePdfPreview();
        }
    }


    useEffect(() => {
        async function setPermissions() {
            let perm = { currentUser };

            const sharedWithUser = opinion.sharedWith.find( shared => shared.user.userId === currentUser._id );
            
            if (sharedWithUser && sharedWithUser.role) {
                perm.sharedRole = sharedWithUser.role;
            }
            if ( !sharedWithUser && currentUser.userData.roles.includes( 'OPINION_CONTROL' ) ){
                // Spezialrolle für Gutachten Kontrolle beachten und wenn vorhanden und nicht "geteilt mit", alle Berechtigungen auf false lassen.
                if (canEdit) setCanEdit(false);
                if (canDelete) setCanDelete(false);
                if (canShare) setCanShare(false);
                if (canCancelShare) setCanCancelShare(false);
                if (canShareWithExplicitRole) setCanShareWithExplicitRole(false);
            }
            else {
                const [edit, del, share, cancelShare, shareWithExplicitRole] = await Promise.all([
                    hasPermission(perm, 'opinion.edit'),
                    hasPermission(perm, 'opinion.remove'),
                    hasPermission(perm, 'shareWith'),
                    hasPermission(perm, 'cancelSharedWith'),
                    hasPermission(perm, 'shareWithExplicitRole')
                ]);

                if (edit != canEdit) setCanEdit(edit);
                if (del != canDelete) setCanDelete(del);
                if (share != canShare) setCanShare(share);
                if (cancelShare != canCancelShare) setCanCancelShare(cancelShare);
                if (shareWithExplicitRole != canShareWithExplicitRole) setCanShareWithExplicitRole(shareWithExplicitRole);
            }
        }
        if(opinion) setPermissions()
    }, [currentUser, opinion, canEdit, canDelete, canShare, canCancelShare, canShareWithExplicitRole])

    let pageHeaderButtons = [];

    if (detailIsLoading) {
        pageHeaderButtons = [
            <Space key="1">
                <Skeleton.Button key="1"/>
                <Skeleton.Button key="2"/>
                <Skeleton.Button key="3"/>
            </Space>
        ];
    } else {
        // no detail? and no refDetail, then we are at the top of the opinion
        if (!detail && refDetail === null) {
            if (canEdit) {
                if (activeTabPane == 'DOCUMENT') {
                    pageHeaderButtons.push(
                        <Switch key="livePdfPreview" 
                            defaultChecked={livePdfPreview} checkedChildren="PDF Vorschau" unCheckedChildren="PDF Vorschau" 
                            disabled={!!selectedDetail} 
                            onChange={toggleLivePdfPreview()} 
                        />
                    );
                } else if(activeTabPane == 'GENERAL'){
                    pageHeaderButtons.push(
                        <ModalOpinion key="general"
                            mode="EDIT"
                            refOpinion={opinionId}
                        />
                    );
                } else if (activeTabPane == 'PDF') {
                    pageHeaderButtons.push(
                        <Button key="pdfPreview" type="dashed" onClick={createPDF(true)} loading={pendingPdfCreation}>
                            <FilePdfOutlined /> Vorschau
                            <Tooltip title="Erstellt eine temporäre PDF Vorschau, die NICHT dauerhaft gespeichert wird"> 
                                <InfoCircleOutlined />
                            </Tooltip>
                        </Button>
                    );
                    pageHeaderButtons.push(
                        <Button key="pdf" type="dashed" onClick={createPDF(false)} loading={pendingPdfCreation}>
                            <FilePdfOutlined /> PDF erstellen
                            <Tooltip title="Erstellt eine PDF Datei, die dauerhaft gespeichert wird"> 
                                <InfoCircleOutlined />
                            </Tooltip>
                        </Button>
                    );
                    pageHeaderButtons.push(
                        <Button key="ExportToDo" type="dashed" onClick={createToDoCSVExport()} loading={pendingCSVExport}>
                            <ExportOutlined /> Maßnahmen Export
                            <Tooltip title="Erstellt einen CSV-Export der 'Zeitlichen Konkretisierung'/OPL"> 
                                <InfoCircleOutlined />
                            </Tooltip>
                        </Button>
                    );

                    /*pageHeaderButtons.push(
                        <Button key="pdfProtected" type="dashed" onClick={createPDF(false,true)} loading={pendingPdfCreation}>
                            <FilePdfOutlined /> Geschütztes PDF erstellen
                            <Tooltip title="Eigentümerkennwort: ID Benutzerkennwort: Die ersten 4 Zeichen der ID"> 
                                <InfoCircleOutlined />
                            </Tooltip>
                        </Button>
                        
                    );*/
                } else if (activeTabPane == 'SHARE' && canShare) {
                    pageHeaderButtons.push(<ModalShareWith key="share" refOpinion={opinionId} canShareWithExplicitRole={canShareWithExplicitRole} adminUser={hasAdminRole} />);
                        /*<Button type="dashed" onClick={null}>
                            <ShareAltOutlined /> Dokument teilen
                        </Button>*/
                }
            }
        } else {
            if (canEdit && detail && layouttypesObject[detail.type].isPictureable) {
                pageHeaderButtons.push(
                    <ModalSortPictures key="sortpicture"
                        refOpinion={opinionId}
                        refParentDetail={detail.refParentDetail}
                        refDetail={detail._id}
                    />
                );
                // place possibility to upload pictures
                // if the detail could have children
                pageHeaderButtons.push(
                    <ModalFileUpload key="fileupload"
                        mode="EDIT"
                        refOpinion={opinionId}
                        refParentDetail={detail.refParentDetail}
                        refDetail={detail._id}
                    />
                );
            }
        }
    }

    const getPageHeaderTitle = () => {
        if (refDetail && detail) {
            if (detail.type == 'HEADING') return detail.printTitle;
            if (detail.type == 'TEXT') return detail.text;
            if (detail.type == 'QUESTION') return detail.printTitle;
            if (detail.type == 'ANSWER') return detail.title;
            if (detail.type == 'BESTIMMUNGEN') return detail.printTitle;
            if (detail.type == 'PAGEBREAK') return detail.title;
            
            return detail.printTitle;
        }
        
        return opinion.title;
    }
    return (
        <Layout>
            <Content>
                <Affix className="affix-opiniondetail" offsetTop={0}>
                    <div style={{paddingTop:8}}>
                        <OpinionBreadcrumb
                            refOpinion={opinionId}
                            refDetail={refDetail}
                        />
                        <PageHeader
                            className="site-page-header"
                            onBack={() => history.back()}
                            title={detailIsLoading || opinionIsLoading ? <Spin /> : getPageHeaderTitle() }
                            extra={pageHeaderButtons}
                        />
                    </div>
                </Affix>

                <Content>
                    { refDetail === null
                        ? <OpinionContent 
                            refOpinion={opinionId} currentUser={currentUser} 
                            canEdit={canEdit} canDelete={canDelete} canCancelShareWith={canCancelShare} canShareWithExplicitRole={canShareWithExplicitRole}
                            onTabPaneChanged={tabPaneChanged} >
                                <ListOpinionDetails
                                    refOpinion={opinionId} 
                                    refParentDetail={refDetail}
                                    currentUser={currentUser}
                                    canEdit={canEdit}
                                    canDelete={canDelete}
                                />
                          </OpinionContent>
                        : detail && detail.type === 'TODOLIST'
                            ? <ActionTodoList refOpinion={opinionId} />
                            : (detail && layouttypesObject[detail.type].hasChilds) || refDetail === null
                                ? <ListOpinionDetails
                                        refOpinion={opinionId} 
                                        refParentDetail={refDetail}
                                        currentUser={currentUser}
                                        canEdit={canEdit}
                                        canDelete={canDelete}
                                />
                                : null 
                    }

                    { /*detail && detail.type === 'TODOLIST'
                        ? <ActionTodoList refOpinion={refOpinion} />
                        : (detail && layouttypesObject[detail.type].hasChilds) || refDetail === null
                            ? <ListOpinionDetails
                                    refOpinion={refOpinion} 
                                    refParentDetail={refDetail}
                                    currentUser={currentUser}
                                    canEdit={canEdit}
                                    canDelete={canDelete}
                            />
                            : null
                */}
                </Content>
            </Content>
            { visiblePdfPreview && pdfPreviewData
                ? <Fragment>
                    <iframe src={pdfPreviewData}
                        frameBorder="0"
                        style={{border:'none',top:48,left:0,width:'100%',height:'calc(100% - 48px)', position:'fixed', zIndex:100}}></iframe>
                    {/*<embed
                        type="application/pdf"
                        src={pdfPreviewData}
                        frameBorder="0"
                        style={{top:48,left:0,width:'100%',height:'calc(100% - 48px)', position:'fixed', zIndex:100}}
                    />*/}
                    <Button
                        style={{
                            top:0,
                            left:0,
                            width:'100%',
                            height:48,
                            position:'fixed',
                            zIndex:100,
                            borderRadius:0
                        }}
                        onClick={()=>{setVisblePdfPreview(false); FlowRouter.setQueryParams({pdfPreview: null})}}
                    >
                        <CloseOutlined /> Vorschau beenden
                    </Button>
                </Fragment>
            : visiblePdfPreview ? <Skeleton loading/> : null }
        </Layout>
    );
}
