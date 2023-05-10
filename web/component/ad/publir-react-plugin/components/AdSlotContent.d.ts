/// <reference types="react" />
import { Config } from '../models/config';
interface Props {
    id: string;
    config: Config;
}
declare const AdSlotContent: ({ id, config }: Props) => JSX.Element;
export default AdSlotContent;
