// @flow
import { selectUser } from 'redux/selectors/user';
import sha256 from 'crypto-js/sha256';

function isInGroupA(userID, experimentID) {
  // Each experiment has a unique experimentID. By concatenating the userID
  // and experimentID, we can generate a unique hash for each
  // user-experiment. This allows us to assign each user to a particular
  // experiment group in a way that:
  //
  // 1. Doesn't require the front-end to send any data to the server about
  //    the assignment.
  // 2. Prevents static assignments (e.g. userID % 2 === 0 always being
  //    in the same group).
  // 3. Is unlikely to interact with other simultaneous experiments in
  //    a biased way. (e.g. if we have two experiments running at the
  //    same time, we can estimate effects of each experiment
  //    competently).
  const treatmentHash = sha256(`${userID}-${experimentID}`);

  // crypto-js gives us access to the `.words` of the hash. However,
  // this requires that all platforms (front-end and back-end) use
  // the same endian-ness for the words. To get around this problem,
  // we get the hex representation of the hash which is consistent.
  const treatmentHex = treatmentHash.toString();

  // Then take the very last byte of the hash and convert it to an integer.
  const treatmentGroup = parseInt(treatmentHex.slice(-1), 16);

  // Finally, we say the user is in group A if the last byte is odd.
  // The equivalent in bigquery would be,
  //
  //   MOD(CAST(CONCAT("0x", SUBSTR(TO_HEX(SHA256(FORMAT("%d-%s", userId, experimentId))), 64)) as int64), 2) = 1
  //
  // which is annoying but consistent.

  return treatmentGroup % 2 === 1;
}

type ABTestProps = {
  experimentId: string,
};

export default function ABTest(props: ABTestProps) {
  const { experimentId } = props;
  const state = window.store.getState();
  const user = selectUser(state);
  const userId = user ? user.id : 0;

  return isInGroupA(userId, experimentId);
}
