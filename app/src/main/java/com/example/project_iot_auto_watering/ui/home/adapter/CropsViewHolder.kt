package com.example.project_iot_auto_watering.ui.home.adapter

import androidx.recyclerview.widget.RecyclerView
import com.example.project_iot_auto_watering.data.model.Crops
import com.example.project_iot_auto_watering.data.model.DataSensor
import com.example.project_iot_auto_watering.databinding.ItemCropsHomeBinding

class CropsViewHolder(private val binding: ItemCropsHomeBinding) :
    RecyclerView.ViewHolder(binding.root) {
    fun bind(crops: Crops, dataSensor: DataSensor) {
        binding.tvNameCrops.text = crops.namePlant
        binding.tvResultTempe.text = dataSensor.temperature
        binding.tvResultHumidity.text = dataSensor.humidity
        binding.tvResultSoil.text = dataSensor.soilMoisture
    }
}