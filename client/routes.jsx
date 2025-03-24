import { FlowRouter } from 'meteor/kadira:flow-router';
import { mount } from 'react-mounter';

import { App } from '/imports/ui/App';


import { Home } from '../imports/ui/Home';
import { InfoForm } from '../imports/ui/Info';
import { ActivitiesForm } from '../imports/ui/ActivitiesForm';
import { OpinionsForm } from '../imports/ui/OpinionsForm';
//import { OpinionsDetailsForm } from '../imports/ui/OpinionsDetailsForm';
import { OpinionsDetailsForm } from '../imports/ui/OpinionsDetailsForm';
import { AppState, setAppState } from '../imports/client/AppState';
import { VerifyEMail } from '../imports/ui/components/VerifyEMail';
import { UserProfileForm } from '../imports/ui/components/user-profile-form';
import { ForgotPassword } from '../imports/ui/ForgotPassword';
import { ResetPassword } from '../imports/ui/ResetPassword';
import { UsersAdminForm } from '../imports/ui/UsersAdminForm';

// https://github.com/kadirahq/flow-router/issues/318
// Prevent routing when there are unsaved changes
// ----------------------------------------------

// This function will be called on every route change.
// Return true to 'prevent' the route from changing.
function preventRouteChange (targetContext) {
    if (AppState.selectedDetail && AppState.selectedDetail.isDirty()) {
      if (!window.confirm('Achtung! Sie befinden sich aktuell in der Bearbeitung eines Details.\n\nMöchten Sie Ihre Änderungen verwerfen?')) {
        return true;
      }
      AppState.selectedDetail.discardChanges();
    }
    if (AppState.selectedDetail) AppState.selectedDetail.discardChanges();
    return false;
  }
  
  // Workaround FlowRouter to provide the ability to prevent route changes
  var previousPath,
    isReverting,
    routeCounter = 0,
    routeCountOnPopState;
  
  window.onpopstate = function () {
    // For detecting whether the user pressed back/forward button.
    routeCountOnPopState = routeCounter;
  };
  
  FlowRouter.triggers.exit([function (context, redirect, stop) {
    // Before we leave the route, cache the current path.
    previousPath = context.path;
  }]);
  
  FlowRouter.triggers.enter([function (context, redirect, stop) {
    routeCounter++;
  
    if (isReverting) {
      isReverting = false;
      // This time, we are simply 'undoing' the previous (prevented) route change.
      // So we don't want to actually fire any route actions.
      stop();
    }
    else if (preventRouteChange(context)) {
      // This route change is not allowed at the present time.
  
      // Prevent the route from firing.
      stop();
  
      isReverting = true;
  
      if (routeCountOnPopState == routeCounter - 1) {
        // This route change was due to browser history - e.g. back/forward button was clicked.
        // We want to undo this route change without overwriting the current history entry.
        // We can't use redirect() because it would overwrite the history entry we are trying
        // to preserve.
  
        // setTimeout allows FlowRouter to finish handling the current route change.
        // Without it, calling FlowRouter.go() at this stage would cause problems (we would
        // ultimately end up at the wrong URL, i.e. that of the current context).
        setTimeout(function () {
            FlowRouter.go(previousPath);
        });
      }
      else {
          // This is a regular route change, e.g. user clicked a navigation control.
          // setTimeout for the same reasons as above.
          setTimeout(function () {
              // Since we know the user didn't navigate using browser history, we can safely use
              // history.back(), keeping the browser history clean.
              history.back();
          });
      }
    }
  }]);


// FlowRouter.route('/verify-email/:token', {
//     name: 'verifyMail',
//     action({ token }) {
//         mount(App, {
//             content: VerifyEMail,
//             token,
//             authenticatedRoute: false
//         });
//     },
// });

FlowRouter.route('/reset-password/:token', {
    name: 'resetPassword',
    action({ token }) {
        mount(App, {
            content: ResetPassword,
            token,
            authenticatedRoute: false
        });
    },
});

FlowRouter.route('/forgotpassword', {
    name: 'forgotpassword',
    action() {
        mount(App, {
            content: ForgotPassword,
            authenticatedRoute: false
        });
    },
});

FlowRouter.route('/profile', {
    name: 'userprofile',
    action() {
        setAppState({livePdfPreview:false});

        mount(App, {
            content: UserProfileForm,
            authenticatedRoute: true
        });
    },
});

FlowRouter.route('/', {
    name: 'root',
    action() {
        setAppState({livePdfPreview:false});

        mount(App, {
            content: Home,
            authenticatedRoute: true
        });
    },
});

FlowRouter.route('/info', {
    name: 'info.show',
    action() {
        setAppState({livePdfPreview:false});

        mount(App, {
            content: InfoForm,
            activeMenuKey: 'INFO',
            authenticatedRoute: true
        });
    },
});

FlowRouter.route('/activities', {
    name: 'activities.show',
    action() {
        setAppState({livePdfPreview:false});

        mount(App, {
            content: ActivitiesForm,
            authenticatedRoute: true
        });
    },
});

FlowRouter.route('/opinions', {
    name: 'opinions.show',
    action() {
        setAppState({livePdfPreview:false});
        
        mount(App, {
            content: OpinionsForm,
            activeMenuKey: 'OPINIONS',
            authenticatedRoute: true
        });
    },
});

FlowRouter.route('/usersAdmin', {
    name: 'usersAdmin.show',
    action() {
               
        mount(App, {
            content: UsersAdminForm,
            authenticatedRoute: true
        });
    },
});

FlowRouter.route('/opinions/:id', {
    name: 'opinion.detail',
    action({ id }) {
        mount(App, {
            content: OpinionsDetailsForm,
            activeMenuKey: 'OPINIONS',
            refOpinion: id,
            refDetail: null,
            authenticatedRoute: true
        });
    },
});

FlowRouter.route('/opinions/:id/:refDetail', {
    name: 'opinion.detail.show',
    action({ id, refDetail }) {
        mount(App, {
            content: OpinionsDetailsForm,
            activeMenuKey: 'OPINIONS',
            refOpinion: id,
            refDetail: refDetail,
            authenticatedRoute: true
        });
    },
});