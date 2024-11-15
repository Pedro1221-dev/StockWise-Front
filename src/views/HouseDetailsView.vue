<template>
    <v-btn color="secondary" @click="goBack">Back</v-btn>
    <div class="house-details">
        <h1>{{ house.name }}</h1>
        <p>{{ house.description }}</p>
        <p><strong>Price:</strong> ${{ house.price }}</p>
        <p><strong>Location:</strong> {{ house.location }}</p>
        <button @click="editHouse">
            <i class="fas fa-edit"></i> Edit
        </button>
    </div>
</template>

<script>
export default {
    data() {
        return {
            house: {
                name: 'Beautiful House',
                description: 'A beautiful house with a great view.',
                price: 500000,
                location: '123 Main St, Anytown, USA'
            }
        };
    },
    methods: {
        goBack() {
        this.$router.push({ name: 'houses' });
        },
        editHouse() {
            // Logic to edit the house details
            console.log('Edit house details');
        }
    }
};
</script>

<style scoped>
.house-details {
    padding: 20px;
}

button {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 10px 20px;
    cursor: pointer;
}

button:hover {
    background-color: #0056b3;
}
</style>