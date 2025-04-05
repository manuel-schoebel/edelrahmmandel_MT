import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { UserActivities } from '/imports/api/collections/userActivities';

Meteor.publish('userActivities', function publishActivities() {
    if (!this.userId) {
        return this.ready();
      }

      console.log("this.userId ", this.userId )

    return UserActivities.find({ refUser: this.userId });
});
