import { PropsWithChildren } from 'react';
interface Props {
    publisherId: string;
}
declare const AdsProvider: ({ publisherId, children }: PropsWithChildren<Props>) => JSX.Element;
export default AdsProvider;
