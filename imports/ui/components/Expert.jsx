import React, { Fragment, useEffect, useState } from 'react'
import { useTracker } from 'meteor/react-meteor-data';

import Avatar from 'antd/lib/avatar';
import Image from 'antd/lib/image';
import Row from 'antd/lib/row';
import Col from 'antd/lib/col';

import { Avatars } from '../../api/collections/avatars';
import { useAvatar } from '../../client/trackers';


export const Expert = ({ user, showFull = true, onlyAvatar }) => {
    if (!user) return null;

    const { userId, firstName, lastName, company, position, qualification, advancedQualification } = user;
    // const [ userAvatarLink, isLoadingAvatar ] = useAvatar(userId);

    // TODO: avatar handling - though it will be deleted so might not worth touching this code again
    const avatar = useTracker(() => {
        const handler = Meteor.subscribe('avatar', userId);
        if (!handler.ready()) {
          return null;
        }
        return Avatars.findOneAsync({ userId: userId });
      }, [userId]);

    const [userAvatarLink, setAvatarLink] = useState(null);
    useEffect(() => {
        async function loadAvatar() {
            const avatar = await Avatars.findOneAsync({ userId });
            setAvatarLink(avatar?.link() || null);
        }
        loadAvatar()
    }, [userId]);

    const getInitials = () => {
        return (firstName && firstName.length > 0)
            ? firstName.substring(0,1) + lastName.substring(0,1)
            : lastName.substring(0,2)
    }
    
    if (onlyAvatar) {
        return userAvatarLink 
            ? <Avatar src={userAvatarLink} />
            : <Avatar style={{ verticalAlign: 'middle' }} >
                { getInitials() }
            </Avatar>
    }

    return (
        <div className="user-avatar-data">
            <Row>
                <Col flex="40px">
                    { userAvatarLink 
                        ? <Avatar src={userAvatarLink} />
                        : <Avatar style={{ verticalAlign: 'middle' }} >
                            { getInitials() }
                          </Avatar>
                    }
                </Col>
                <Col flex="auto">
                    { showFull ? <div className="user-name" style={{marginTop: 6}}>{firstName} {lastName}</div>
                            : null
                    }
                </Col>
            </Row>
            <Row>
                <Col flex="40px">
                    
                </Col>
                <Col flex="auto">
                    <div className="user-data">
                        { advancedQualification && showFull
                            ? <div className="advanced-qualification" style={{color:'#999'}}>{advancedQualification}</div>
                            : null
                        }
                        { company && showFull
                            ? <div className="company" style={{color:'#666', fontWeight: 600}}>{company}</div>
                            : null
                        }
                        { position && showFull
                            ? <div className="position" style={{color:'#999'}}>{position}</div>
                            : null
                        }
                        { qualification && showFull
                            ? <div className="qualification" style={{color:'#999'}}>{qualification}</div>
                            : null
                        }
                    </div>
                </Col>
            </Row>
        </div>
    );
}