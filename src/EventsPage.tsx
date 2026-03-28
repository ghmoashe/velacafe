import EventsManager, { type EventsManagerSharedProps } from "./EventsManager";

type EventsPageProps = {
  strings: Record<string, string>;
  guestMode: boolean;
  eventsManagerProps: EventsManagerSharedProps;
};

export default function EventsPage(props: EventsPageProps) {
  const { strings, guestMode, eventsManagerProps } = props;

  return (
    <div className="eventsPage">
      <div className="eventsHeader">
        <div className="eventsTitle">{strings.eventsTitle}</div>
        <div className="eventsSubtitle">{strings.eventsSubtitle}</div>
      </div>
      {!guestMode ? (
        <EventsManager
          {...eventsManagerProps}
          showOrganizerHint
          showEditor={eventsManagerProps.profileIsOrganizer}
          canEditItems={eventsManagerProps.profileIsOrganizer}
          listTitle={strings.eventListTitle}
          emptyLabel={strings.eventEmpty}
        />
      ) : null}
    </div>
  );
}
