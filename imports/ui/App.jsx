import React, { useEffect } from 'react';

import Spin from 'antd/lib/spin';
import { Routes, Route } from "react-router";

import { LoginForm } from '/imports/ui/LoginForm';
import { SiteLayout } from '/imports/ui/SiteLayout';
import { useAccount, useRoles } from '../client/trackers';
import { useAppState } from '../client/AppState';
import { Home } from './Home';
import { InfoForm } from './Info';
import { OpinionsForm } from './OpinionsForm';
import { OpinionsDetailsForm } from './OpinionsDetailsForm';


export const App = ({content, refOpinion, refDetail, activeMenuKey, ...props}) => {
    const { currentUser, isLoggedIn, accountsReady, hasAdminRole } = useAccount();
    const [roles, isLoadingRoles] = useRoles();
    const [ appIsBusy ] = useAppState('appIsBusy');

    var keys = {37: 1, 38: 1, 39: 1, 40: 1, 27:1, 83:1, 115:1 };
    function preventDefault(e) {
        if (appIsBusy) {
            console.log('preventDefault', appIsBusy)
            e.preventDefault();
        }
    }

    function preventDefaultForScrollKeys(e) {
        if (keys[e.keyCode]) {
            preventDefault(e);
            return false;
        }
    }

    // modern Chrome requires { passive: false } when adding event
    var supportsPassive = false;
    try {
        window.addEventListener("test", null, Object.defineProperty({}, 'passive', {
            get: function () { supportsPassive = true; } 
        }));
    } catch(e) {}

    var wheelOpt = supportsPassive ? { passive: false } : false;
    var wheelEvent = 'onwheel' in document.createElement('div') ? 'wheel' : 'mousewheel';

    // call this to Disable
    function disableScrollWhenBusy() {
        window.addEventListener('DOMMouseScroll', preventDefault, false); // older FF
        window.addEventListener(wheelEvent, preventDefault, wheelOpt); // modern desktop
        window.addEventListener('touchmove', preventDefault, wheelOpt); // mobile
        document.addEventListener('keydown', preventDefaultForScrollKeys, false);
    }

    // call this to Enable
    function enableScroll() {
        window.removeEventListener('DOMMouseScroll', preventDefault, false);
        window.removeEventListener(wheelEvent, preventDefault, wheelOpt); 
        window.removeEventListener('touchmove', preventDefault, wheelOpt);
        document.removeEventListener('keydown', preventDefaultForScrollKeys, false);
    }

    useEffect(() => {
        const reactRoot = document.getElementById('react-root');
        
        // add done for the initial loading
        reactRoot.classList.add('done');

        disableScrollWhenBusy();  

        return () => {
            enableScroll();
        }
    }, [appIsBusy]);

    if (!accountsReady || isLoadingRoles) {
        return <Spin size="large" />
    }

    if (!isLoggedIn) {
        return <LoginForm />
    }

    /*const avoidUserActionWhenBusy = e => {
        console.log('scroll');
        if (appIsBusy) {
            e.preventDefault();
            e.stopPropagation();
        }
    }*/


    return (
        <Routes>
            <Route element={<SiteLayout activeMenuKey={activeMenuKey}
                refOpinion={refOpinion}
                refDetail={refDetail}
                currentUser={currentUser}
                hasAdminRole={hasAdminRole}
            />}>
                <Route index element={<Home />} />
                <Route path="info" element={<InfoForm />} />
                <Route path="opinions" element={<OpinionsForm currentUser={currentUser} />} />
                <Route path="opinions/:opinionId" element={<OpinionsDetailsForm currentUser={currentUser}/>} />
                <Route path="opinions/:opinionId/:refDetail" element={<OpinionsDetailsForm currentUser={currentUser}/>} />
            </Route>
        </Routes>
    )
}   