package com.example.project_iot_auto_watering.ui.sensor.adapter

import android.util.Log
import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.Toast
import androidx.recyclerview.widget.RecyclerView
import com.example.project_iot_auto_watering.R
import com.example.project_iot_auto_watering.data.model.response.DataEspAll
import com.example.project_iot_auto_watering.databinding.ItemSensorBinding

class AdapterDevice(
    private val listEspDevice: List<DataEspAll>,
    private val listener: (Boolean)->Unit
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
        holder.binding.btnState.setOnClickListener {
            Log.d("DEBUG-WIFI","click item")
            if(esp.isConnected){
                listener(true)
            }
            else{
                listener(false)
            }
        }
    }

    override fun getItemCount(): Int {
        return listEspDevice.size
    }


    class DeviceViewHolder(val binding: ItemSensorBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(espDevice: DataEspAll) {
            binding.tvNameCrops.text = espDevice.garden.name
            binding.tvNameSensor.text = espDevice.espId
            binding.btnState.text = if (espDevice.isConnected) "On" else "Off"
            if(espDevice.isConnected){
                binding.imgWifi.setImageResource(R.drawable.icon_wifi)
            }
            else{
                binding.imgWifi.setImageResource(R.drawable.icon_loss_connect)
            }
        }
    }
}
