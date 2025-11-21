package com.example.project_iot_auto_watering.ui.sensor.adapter

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.example.project_iot_auto_watering.data.model.response.DataEspAll
import com.example.project_iot_auto_watering.databinding.ItemSensorBinding

class AdapterDevice(
    private val listEspDevice: List<DataEspAll>,
) : RecyclerView.Adapter<AdapterDevice.DeviceViewHolder>() {
    override fun onCreateViewHolder(
        parent: ViewGroup,
        viewType: Int
    ): DeviceViewHolder {
        val binding = ItemSensorBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return DeviceViewHolder(binding)
    }

    override fun onBindViewHolder(
        holder: DeviceViewHolder,
        position: Int
    ) {
        val esp = listEspDevice[position]
        holder.bind(esp)
    }

    override fun getItemCount(): Int {
        return listEspDevice.size
    }


    class DeviceViewHolder(val binding: ItemSensorBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(espDevice: DataEspAll) {
            binding.tvNameCrops.text = espDevice.garden.name
            binding.tvNameSensor.text = espDevice.espId
            binding.btnState.text = if (espDevice.isConnected) "On" else "Off"
            binding.imgWifi.setOnClickListener {

            }
        }
    }
}