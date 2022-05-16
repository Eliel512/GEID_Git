exports.getHost = () => {
    return `${process.env.host}:${process.env.PORT || '3000'}`;
};