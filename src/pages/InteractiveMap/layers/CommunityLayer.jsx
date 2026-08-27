/**
 * CommunityLayer.jsx — renders the "Comunidade" tab markers.
 *
 * Splits incoming trips into two colour groups:
 *   • following (light blue heart) — trips from users you follow
 *   • public (orange star)         — open public catalogue
 *
 * The two lists are independent: a "following" filter on/off doesn't
 * affect the "public" list. This matches the legacy behaviour and
 * the filter chips the user expects.
 */
import React from "react";
import TripMarker from "../markers/TripMarker";
import { useTripIcon } from "../markers/useTripIcon";

const FOLLOWING_COLOR = "#5BA8FF";
const FOLLOWING_TYPE = "following";
const PUBLIC_COLOR = "#FF9900";
const PUBLIC_TYPE = "public";

const CommunityLayer = ({ following, publicTrips }) => {
  const followingIcon = useTripIcon(FOLLOWING_COLOR, FOLLOWING_TYPE);
  const publicIcon = useTripIcon(PUBLIC_COLOR, PUBLIC_TYPE);

  return (
    <>
      {following.map((trip, i) => (
        <TripMarker key={`f-${trip.id}-${i}`} trip={trip} icon={followingIcon} />
      ))}
      {publicTrips.map((trip, i) => (
        <TripMarker key={`p-${trip.id}-${i}`} trip={trip} icon={publicIcon} />
      ))}
    </>
  );
};

export default React.memo(CommunityLayer);
