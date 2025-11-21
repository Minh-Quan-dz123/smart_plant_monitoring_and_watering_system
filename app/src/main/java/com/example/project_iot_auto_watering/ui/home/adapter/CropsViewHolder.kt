package com.example.project_iot_auto_watering.ui.home.adapter

import androidx.recyclerview.widget.RecyclerView
import com.example.project_iot_auto_watering.data.model.response.DataEspAll
import com.example.project_iot_auto_watering.data.model.response.EspDevice
import com.example.project_iot_auto_watering.data.model.response.Garden
import com.example.project_iot_auto_watering.databinding.ItemCropsHomeBinding

class CropsViewHolder(private val binding: ItemCropsHomeBinding) :
    RecyclerView.ViewHolder(binding.root) {
    fun bind(crops: Garden, esp: DataEspAll) {
        binding.tvNameCrops.text = crops.name
        binding.tvResultHumidity.text = esp.airHumidity.toString()
        binding.tvResultSoil.text = esp.soilMoisture.toString()
        binding.tvResultTempe.text = esp.temperature.toString()
    }
}