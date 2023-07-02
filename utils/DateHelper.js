import { ApolloError } from 'apollo-server-express';

function compareDates(startDate, endDate) {
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (startDateObj >= endDateObj) {
        throw new ApolloError('Start date must be before end date');
    }
}

export {
    compareDates
}