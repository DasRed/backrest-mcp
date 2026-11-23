export default interface ConnectFrameInterface {
    data: unknown;
    /** true for the trailing frame that ends a Connect stream */
    endStream: boolean;
}
